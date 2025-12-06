import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "barter_request" | "barter_accepted" | "barter_declined" | "new_message";
  recipientUserId: string;
  senderName: string;
  additionalData?: Record<string, string>;
}

const emailTemplates = {
  barter_request: (senderName: string) => ({
    subject: `New Barter Request from ${senderName}`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; margin-bottom: 24px;">New Barter Request! 🤝</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          <strong>${senderName}</strong> wants to exchange skills with you on Barterly.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Log in to your account to view the request and start exchanging skills!
        </p>
        <p style="color: #999; font-size: 14px; margin-top: 32px;">
          - The Barterly Team
        </p>
      </div>
    `,
  }),
  barter_accepted: (senderName: string) => ({
    subject: `${senderName} accepted your barter request!`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; margin-bottom: 24px;">Great News! 🎉</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          <strong>${senderName}</strong> has accepted your barter request!
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          You can now start chatting and arrange your skill exchange.
        </p>
        <p style="color: #999; font-size: 14px; margin-top: 32px;">
          - The Barterly Team
        </p>
      </div>
    `,
  }),
  barter_declined: (senderName: string) => ({
    subject: `Barter request update`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; margin-bottom: 24px;">Request Update</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Unfortunately, <strong>${senderName}</strong> has declined your barter request.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Don't worry - there are many other skill barterers waiting to connect with you!
        </p>
        <p style="color: #999; font-size: 14px; margin-top: 32px;">
          - The Barterly Team
        </p>
      </div>
    `,
  }),
  new_message: (senderName: string) => ({
    subject: `New message from ${senderName}`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; margin-bottom: 24px;">New Message! 💬</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          <strong>${senderName}</strong> sent you a new message on Barterly.
        </p>
        <p style="color: #999; font-size: 14px; margin-top: 32px;">
          - The Barterly Team
        </p>
      </div>
    `,
  }),
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientUserId, senderName }: NotificationRequest = await req.json();

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get recipient's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email_notifications")
      .eq("user_id", recipientUserId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    // Check if user wants email notifications
    if (!profile?.email_notifications) {
      return new Response(
        JSON.stringify({ message: "User has disabled email notifications" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user's email from auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(recipientUserId);
    
    if (authError || !authUser?.user?.email) {
      console.error("Error fetching user email:", authError);
      throw new Error("Could not fetch user email");
    }

    const template = emailTemplates[type](senderName);

    // Send email using Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Barterly <onboarding@resend.dev>",
        to: [authUser.user.email],
        subject: template.subject,
        html: template.html,
      }),
    });

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
