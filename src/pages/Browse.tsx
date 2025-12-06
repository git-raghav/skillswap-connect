import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SkillCard from "@/components/skills/SkillCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, SlidersHorizontal, X, Loader2, Star } from "lucide-react";
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
  languages: string[];
}

const categories = ["All", "Technology", "Music", "Creative", "Fitness", "Languages", "Sports", "Design", "Business"];

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [skills, setSkills] = useState<SkillListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [locationFilter, setLocationFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
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
          skill_wanted,
          languages
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
            rating: avgRating || 0,
            reviews: ratings?.length || 0,
            location: profile.location || "Remote",
            category: skillData?.category || "General",
            userId: profile.user_id,
            languages: (profile.languages as string[]) || [],
          };
        })
      );

      setSkills(skillListings);

      // Extract unique locations and languages for filters
      const locations = [...new Set(skillListings.map(s => s.location).filter(Boolean))];
      const languages = [...new Set(skillListings.flatMap(s => s.languages).filter(Boolean))];
      setAvailableLocations(locations);
      setAvailableLanguages(languages);
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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setMinRating(0);
    setLocationFilter("");
    setLanguageFilter("");
  };

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.skillOffered.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.skillWanted.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || skill.category === selectedCategory;
    const matchesRating = skill.rating >= minRating;
    const matchesLocation = !locationFilter || skill.location === locationFilter;
    const matchesLanguage = !languageFilter || skill.languages.includes(languageFilter);
    
    return matchesSearch && matchesCategory && matchesRating && matchesLocation && matchesLanguage;
  });

  const hasActiveFilters = minRating > 0 || locationFilter || languageFilter;

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
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="lg" className="gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Skills</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    {/* Rating Filter */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary" />
                        Minimum Rating: {minRating.toFixed(1)}
                      </Label>
                      <Slider
                        value={[minRating]}
                        onValueChange={(value) => setMinRating(value[0])}
                        max={5}
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    {/* Location Filter */}
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Select value={locationFilter || "all"} onValueChange={(v) => setLocationFilter(v === "all" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All locations</SelectItem>
                          {availableLocations.map((loc) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Language Filter */}
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={languageFilter || "all"} onValueChange={(v) => setLanguageFilter(v === "all" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All languages" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All languages</SelectItem>
                          {availableLanguages.map((lang) => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={clearFilters}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
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
              <Button variant="outline" onClick={clearFilters}>
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