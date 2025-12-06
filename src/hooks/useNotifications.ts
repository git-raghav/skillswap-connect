import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface NotificationCounts {
  unreadRequests: number;
  unreadMessages: number;
  total: number;
}

export const useNotifications = () => {
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadRequests: 0,
    unreadMessages: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCounts = async () => {
    if (!user) {
      setCounts({ unreadRequests: 0, unreadMessages: 0, total: 0 });
      setLoading(false);
      return;
    }

    try {
      // Count pending barter requests received by user
      const { count: requestCount } = await supabase
        .from("barter_requests")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("status", "pending");

      // Count unread messages (messages in accepted barters not sent by user)
      const { data: barters } = await supabase
        .from("barter_requests")
        .select("id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      let messageCount = 0;
      if (barters && barters.length > 0) {
        const barterIds = barters.map((b) => b.id);
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("barter_id", barterIds)
          .neq("sender_id", user.id)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
        messageCount = count || 0;
      }

      setCounts({
        unreadRequests: requestCount || 0,
        unreadMessages: messageCount,
        total: (requestCount || 0) + messageCount,
      });
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Subscribe to changes
    if (user) {
      const requestChannel = supabase
        .channel("notification-requests")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "barter_requests",
          },
          () => fetchCounts()
        )
        .subscribe();

      const messageChannel = supabase
        .channel("notification-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          () => fetchCounts()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(requestChannel);
        supabase.removeChannel(messageChannel);
      };
    }
  }, [user]);

  return { counts, loading, refetch: fetchCounts };
};
