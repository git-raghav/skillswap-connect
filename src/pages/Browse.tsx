import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SkillCard from "@/components/skills/SkillCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

const categories = ["All", "Technology", "Music", "Creative", "Fitness", "Languages", "Sports", "Design", "Business"];

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [skills, setSkills] = useState<SkillListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          full_name,
          avatar_url,
          location,
          skill_offered,
          skill_wanted
        `)
        .not("skill_offered", "is", null);

      if (error) throw error;

      // Get ratings for each user
      const skillListings: SkillListing[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: ratings } = await supabase
            .from("ratings")
            .select("rating")
            .eq("rated_id", profile.user_id);

          const avgRating = ratings?.length
            ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length
            : 0;

          // Get skill category from skills table
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
            rating: avgRating || 4.5,
            reviews: ratings?.length || 0,
            location: profile.location || "Remote",
            category: skillData?.category || "General",
            userId: profile.user_id,
          };
        })
      );

      setSkills(skillListings);
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBarter = async (skillListing: SkillListing) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to request a barter",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("barter_requests").insert({
        requester_id: user.id,
        recipient_id: skillListing.userId,
        message: `Hi! I'd like to exchange skills with you.`,
      });

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: `Your barter request has been sent to ${skillListing.userName}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send request",
        variant: "destructive",
      });
    }
  };

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.skillOffered.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.skillWanted.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Browse Skills
            </h1>
            <p className="text-lg text-muted-foreground">
              Find people with skills you want to learn
            </p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 space-y-4"
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search skills, people, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button variant="outline" size="lg" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className={`cursor-pointer transition-all px-4 py-2 text-sm ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mb-6"
          >
            {loading ? "Loading..." : `Showing ${filteredSkills.length} results`}
          </motion.p>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Skills Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSkills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <SkillCard 
                    {...skill} 
                    onRequestBarter={() => handleRequestBarter(skill)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredSkills.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-xl text-muted-foreground mb-4">
                {skills.length === 0 
                  ? "No skills listed yet. Be the first to add yours!"
                  : "No skills found matching your criteria"}
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
                Clear Filters
              </Button>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Browse;
