import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SkillCard from "@/components/skills/SkillCard";
import SkillCardSkeleton from "@/components/ui/SkillCardSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Heart, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";

interface SkillListing {
  id: string;
  userName: string;
  userAvatar: string;
  skillOffered: string;
  skillWanted: string;
  rating: number;
  reviews: number;
  location: string;
  category: string;
  userId: string;
}

const Favorites = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favLoading } = useFavorites();
  const { toast } = useToast();
  const [skills, setSkills] = useState<SkillListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { isUserOnline } = useOnlinePresence();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (favorites.length > 0) {
      fetchFavoriteProfiles();
    } else if (!favLoading) {
      setLoading(false);
    }
  }, [favorites, authLoading, favLoading, user]);

  const fetchFavoriteProfiles = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", favorites);

      if (error) throw error;

      const skillListings: SkillListing[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: ratings } = await supabase
            .from("ratings")
            .select("rating")
            .eq("rated_id", profile.user_id);

          const avgRating = ratings?.length
            ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length
            : 0;

          const { data: skillData } = await supabase
            .from("skills")
            .select("category")
            .eq("user_id", profile.user_id)
            .eq("skill_type", "offered")
            .limit(1)
            .maybeSingle();

          return {
            id: profile.id,
            userName: profile.full_name || "Anonymous",
            userAvatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`,
            skillOffered: profile.skill_offered || "Various Skills",
            skillWanted: profile.skill_wanted || "Open to offers",
            rating: avgRating,
            reviews: ratings?.length || 0,
            location: profile.location || "Remote",
            category: skillData?.category || "General",
            userId: profile.user_id,
          };
        })
      );

      setSkills(skillListings);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBarter = async (skill: SkillListing) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("barter_requests").insert({
        requester_id: user.id,
        recipient_id: skill.userId,
        message: `Hi! I'd like to exchange skills with you.`,
      });

      if (error) throw error;
      toast({ title: "Request sent!", description: `Your request has been sent to ${skill.userName}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-8 h-8 text-primary fill-primary" />
                <h1 className="text-3xl font-bold text-foreground">Saved Skills</h1>
              </div>
              <p className="text-muted-foreground">Your bookmarked skill providers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkillCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-primary fill-primary" />
              <h1 className="text-3xl font-bold text-foreground">Saved Skills</h1>
            </div>
            <p className="text-muted-foreground">Your bookmarked skill providers</p>
          </motion.div>

          {skills.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No saved skills yet"
              description="Browse skills and click the heart icon to save them for later. Your bookmarked skill providers will appear here."
              actionLabel="Browse Skills"
              onAction={() => navigate("/browse")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SkillCard 
                    {...skill}
                    isOnline={isUserOnline(skill.userId)}
                    onRequestBarter={() => handleRequestBarter(skill)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
