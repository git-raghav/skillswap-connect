import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  const checkBanStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking ban status:", error);
        return false;
      }
      
      return data?.is_banned ?? false;
    } catch (error) {
      console.error("Error checking ban status:", error);
      return false;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check ban status after auth state change
        if (session?.user) {
          setTimeout(async () => {
            const banned = await checkBanStatus(session.user.id);
            setIsBanned(banned);
            if (banned) {
              // Sign out banned users
              await supabase.auth.signOut();
              setUser(null);
              setSession(null);
            }
            setLoading(false);
          }, 0);
        } else {
          setIsBanned(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const banned = await checkBanStatus(session.user.id);
        setIsBanned(banned);
        if (banned) {
          // Sign out banned users
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut, isBanned };
};
