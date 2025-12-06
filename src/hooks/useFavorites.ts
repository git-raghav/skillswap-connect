import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("favorited_profile_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.favorited_profile_id) || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (profileId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    const isFavorited = favorites.includes(profileId);

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("favorited_profile_id", profileId);

        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== profileId));
        toast({ title: "Removed from favorites" });
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, favorited_profile_id: profileId });

        if (error) throw error;
        setFavorites(prev => [...prev, profileId]);
        toast({ title: "Added to favorites" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isFavorite = (profileId: string) => favorites.includes(profileId);

  return { favorites, loading, toggleFavorite, isFavorite, refetch: fetchFavorites };
};
