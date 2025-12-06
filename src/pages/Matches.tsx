import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRightLeft, MapPin, Star, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import OnlineIndicator from "@/components/ui/OnlineIndicator";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";

interface Match {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  location: string;
  rating: number;
  reviews: number;
  theyOffer: string;
  theyWant: string;
  youOffer: string;
  youWant: string;
  matchScore: number;
}

const Matches = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { isUserOnline } = useOnlinePresence();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchMatches();
    }
  }, [user, authLoading]);

  const fetchMatches = async () => {
    if (!user) return;

    try {
      // Get current user's profile
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!myProfile || !myProfile.skill_wanted || !myProfile.skill_offered) {
        setUserProfile(myProfile);
        setLoading(false);
        return;
      }

      setUserProfile(myProfile);

      // Get all other profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user.id)
        .not("skill_offered", "is", null)
        .not("skill_wanted", "is", null);

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Find matches - people who want what you offer AND offer what you want
      const potentialMatches: Match[] = [];

      for (const profile of profiles) {
        const mySkillOffered = (myProfile.skill_offered || "").toLowerCase();
        const mySkillWanted = (myProfile.skill_wanted || "").toLowerCase();
        const theirSkillOffered = (profile.skill_offered || "").toLowerCase();
        const theirSkillWanted = (profile.skill_wanted || "").toLowerCase();

        // Calculate match score
        let matchScore = 0;
        
        // Perfect match: they want what you offer AND they offer what you want
        const theyWantWhatYouOffer = theirSkillWanted.includes(mySkillOffered) || mySkillOffered.includes(theirSkillWanted);
        const theyOfferWhatYouWant = theirSkillOffered.includes(mySkillWanted) || mySkillWanted.includes(theirSkillOffered);

        if (theyWantWhatYouOffer && theyOfferWhatYouWant) {
          matchScore = 100;
        } else if (theyWantWhatYouOffer || theyOfferWhatYouWant) {
          matchScore = 50;
        }

        if (matchScore > 0) {
          // Get ratings
          const { data: ratings } = await supabase
            .from("ratings")
            .select("rating")
            .eq("rated_id", profile.user_id);

          const avgRating = ratings?.length
            ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length
            : 0;

          potentialMatches.push({
            id: profile.id,
            userId: profile.user_id,
            userName: profile.full_name || "Anonymous",
            userAvatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`,
            location: profile.location || "Remote",
            rating: avgRating,
            reviews: ratings?.length || 0,
            theyOffer: profile.skill_offered,
            theyWant: profile.skill_wanted,
            youOffer: myProfile.skill_offered,
            youWant: myProfile.skill_wanted,
            matchScore,
          });
        }
      }

      // Sort by match score
      potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
      setMatches(potentialMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBarter = async (match: Match) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("barter_requests").insert({
        requester_id: user.id,
        recipient_id: match.userId,
        message: `Hi! We're a perfect match - you want to learn ${match.theyWant} and I can teach it. I'd love to learn ${match.theyOffer} from you!`,
      });

      if (error) throw error;
      toast({ title: "Request sent!", description: `Your barter request has been sent to ${match.userName}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Skeleton loading component for matches
  const MatchSkeleton = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="flex-1">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Perfect Matches</h1>
              </div>
              <p className="text-muted-foreground">People whose skills complement yours perfectly</p>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MatchSkeleton />
                </motion.div>
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
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Perfect Matches</h1>
            </div>
            <p className="text-muted-foreground">
              People whose skills complement yours perfectly
            </p>
          </motion.div>

          {!userProfile?.skill_offered || !userProfile?.skill_wanted ? (
            <EmptyState
              icon={Sparkles}
              title="Complete your profile first"
              description="Add your skills offered and wanted to find matches. We'll help you discover people with complementary skills!"
              actionLabel="Complete Profile"
              onAction={() => navigate("/profile")}
            />
          ) : matches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No matches yet"
              description="We'll find matches as more people join with complementary skills. In the meantime, browse all available skills!"
              actionLabel="Browse All Skills"
              onAction={() => navigate("/browse")}
            />
          ) : (
            <div className="space-y-4">
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        {/* User Info */}
                        <button 
                          onClick={() => navigate(`/profile/${match.userId}`)}
                          className="flex items-center gap-4 text-left"
                        >
                          <div className="relative">
                            <img
                              src={match.userAvatar}
                              alt={match.userName}
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                            />
                            <OnlineIndicator 
                              isOnline={isUserOnline(match.userId)} 
                              size="md" 
                              className="bottom-0 right-0" 
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-foreground hover:text-primary transition-colors">
                              {match.userName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {match.location}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-4 h-4 text-primary fill-primary" />
                              <span className="text-sm font-medium">{match.rating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({match.reviews})</span>
                            </div>
                          </div>
                        </button>

                        {/* Match Details */}
                        <div className="flex-1 bg-muted/50 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">They offer (You want!)</p>
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                {match.theyOffer}
                              </Badge>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <ArrowRightLeft className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-xs text-muted-foreground mb-1">They want (You offer!)</p>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                {match.theyWant}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Match Score & Action */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <Badge 
                              variant={match.matchScore === 100 ? "default" : "secondary"}
                              className={match.matchScore === 100 ? "bg-gradient-to-r from-primary to-accent" : ""}
                            >
                              {match.matchScore}% Match
                            </Badge>
                          </div>
                          <Button onClick={() => handleRequestBarter(match)} className="gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Request Barter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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

export default Matches;
