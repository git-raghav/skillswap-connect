import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OnlineUser {
  id: string;
  online_at: string;
}

export const useOnlinePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<OnlineUser>();
        const userIds = Object.keys(state);
        setOnlineUsers(userIds);
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key && !onlineUsers.includes(key)) {
          setOnlineUsers((prev) => [...prev, key]);
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key) {
          setOnlineUsers((prev) => prev.filter((id) => id !== key));
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isUserOnline = (userId: string) => onlineUsers.includes(userId);

  return { onlineUsers, isUserOnline };
};
