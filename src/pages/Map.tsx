import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, ArrowRightLeft, Loader2, Search, Users, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface LocationGroup {
  location: string;
  users: {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    skillOffered: string;
    skillWanted: string;
    rating: number;
  }[];
}

const Map = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .not("location", "is", null);

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Group users by location
      const groups: Record<string, LocationGroup["users"]> = {};

      for (const profile of profiles) {
        const location = profile.location || "Remote";
        
        if (!groups[location]) {
          groups[location] = [];
        }

        // Get rating
        const { data: ratings } = await supabase
          .from("ratings")
          .select("rating")
          .eq("rated_id", profile.user_id);

        const avgRating = ratings?.length
          ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length
          : 0;

        groups[location].push({
          id: profile.id,
          userId: profile.user_id,
          userName: profile.full_name || "Anonymous",
          userAvatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`,
          skillOffered: profile.skill_offered || "Various Skills",
          skillWanted: profile.skill_wanted || "Open to offers",
          rating: avgRating,
        });
      }

      const groupArray = Object.entries(groups)
        .map(([location, users]) => ({ location, users }))
        .sort((a, b) => b.users.length - a.users.length);

      setLocationGroups(groupArray);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBarter = async (userId: string, userName: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to request a barter", variant: "destructive" });
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("barter_requests").insert({
        requester_id: user.id,
        recipient_id: userId,
        message: `Hi! I'd like to exchange skills with you.`,
      });

      if (error) throw error;
      toast({ title: "Request sent!", description: `Your request has been sent to ${userName}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredGroups = locationGroups.filter(
    (group) =>
      group.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.users.some(
        (u) =>
          u.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.skillOffered.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
              <Globe className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Discover by Location</h1>
            </div>
            <p className="text-muted-foreground">
              Find skill providers near you or explore other locations
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search locations, names, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12"
              />
            </div>
          </motion.div>

          {/* Location Groups */}
          <div className="space-y-8">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-16">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">No locations found</p>
              </div>
            ) : (
              filteredGroups.map((group, groupIndex) => (
                <motion.div
                  key={group.location}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + groupIndex * 0.05 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{group.location}</h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.users.length} skill provider{group.users.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.users.map((u) => (
                      <Card key={u.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <button
                              onClick={() => navigate(`/profile/${u.userId}`)}
                              className="flex items-center gap-3"
                            >
                              <img
                                src={u.userAvatar}
                                alt={u.userName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                              />
                              <div className="text-left">
                                <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                                  {u.userName}
                                </h3>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-primary fill-primary" />
                                  <span className="text-xs text-muted-foreground">
                                    {u.rating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </div>

                          <div className="bg-muted/50 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="secondary" className="text-xs">
                                Offers: {u.skillOffered}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm mt-2">
                              <Badge variant="outline" className="text-xs">
                                Wants: {u.skillWanted}
                              </Badge>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handleRequestBarter(u.userId, u.userName)}
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                            Request Barter
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Map;
