import { supabase } from "@/integrations/supabase/client";

type NotificationType = "barter_request" | "barter_accepted" | "barter_declined" | "new_message";

interface SendNotificationParams {
  type: NotificationType;
  recipientUserId: string;
  senderName: string;
  additionalData?: Record<string, string>;
}

export const useSendNotification = () => {
  const sendNotification = async ({ 
    type, 
    recipientUserId, 
    senderName, 
    additionalData 
  }: SendNotificationParams) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: { type, recipientUserId, senderName, additionalData },
      });

      if (error) {
        console.error("Error sending notification:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error invoking notification function:", error);
      return { success: false, error };
    }
  };

  return { sendNotification };
};
