import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SkillCard from "@/components/skills/SkillCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ArrowLeft, 
  Loader2,
  Code,
  Music,
  Palette,
  Dumbbell,
  Languages,
  Briefcase,
  Layers,
  Camera,
  BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

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

const iconMap: Record<string, React.ReactNode> = {
  Code: <Code className="w-6 h-6" />,
  Music: <Music className="w-6 h-6" />,
  Palette: <Palette className="w-6 h-6" />,
  Dumbbell: <Dumbbell className="w-6 h-6" />,
  Languages: <Languages className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
  Layers: <Layers className="w-6 h-6" />,
  Camera: <Camera className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
};

const Categories = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<SkillListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryName) {
      fetchSkillsByCategory();
    } else {
      fetchCategories();
    }
  }, [categoryName]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("skill_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillsByCategory = async () => {
    try {
      // Get profiles with matching category skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("skills")
        .select("user_id, title, category")
        .eq("category", categoryName)
        .eq("skill_type", "offered");

      if (skillsError) throw skillsError;

      const userIds = [...new Set(skillsData?.map(s => s.user_id) || [])];
      
      if (userIds.length === 0) {
        setSkills([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const skillListings: SkillListing[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: ratings } = await supabase
            .from("ratings")
            .select("rating")
            .eq("rated_id", profile.user_id);

          const avgRating = ratings?.length
            ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length
            : 0;

          return {
            id: profile.id,
            userName: profile.full_name || "Anonymous",
            userAvatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`,
            skillOffered: profile.skill_offered || "Various Skills",
            skillWanted: profile.skill_wanted || "Open to offers",
            rating: avgRating || 4.5,
            reviews: ratings?.length || 0,
            location: profile.location || "Remote",
            category: categoryName || "General",
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

  const handleRequestBarter = async (skill: SkillListing) => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      navigate("/auth");
      return;
    }

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

  const filteredSkills = skills.filter(skill =>
    skill.skillOffered.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Category detail view
  if (categoryName) {
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
              <Button 
                variant="ghost" 
                className="mb-4 gap-2" 
                onClick={() => navigate("/categories")}
              >
                <ArrowLeft className="w-4 h-4" />
                All Categories
              </Button>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {categoryName} Skills
              </h1>
              <p className="text-lg text-muted-foreground">
                Find people offering {categoryName.toLowerCase()} skills
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>
            </motion.div>

            {filteredSkills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSkills.map((skill, index) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <SkillCard {...skill} onRequestBarter={() => handleRequestBarter(skill)} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <p className="text-lg text-muted-foreground">
                  No skills found in this category yet.
                </p>
                <Button className="mt-4" onClick={() => navigate("/browse")}>
                  Browse All Skills
                </Button>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Categories list view
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Skill Categories
            </h1>
            <p className="text-lg text-muted-foreground">
              Browse skills by category to find exactly what you need
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <button
                  onClick={() => navigate(`/categories/${category.name}`)}
                  className="w-full p-6 bg-card rounded-2xl border border-border shadow-card hover:shadow-hover transition-all text-left group"
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: category.color ? `${category.color}20` : 'hsl(var(--primary) / 0.1)' }}
                  >
                    <span style={{ color: category.color || 'hsl(var(--primary))' }}>
                      {category.icon && iconMap[category.icon] ? iconMap[category.icon] : <Layers className="w-6 h-6" />}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description || `Explore ${category.name.toLowerCase()} skills`}
                  </p>
                </button>
              </motion.div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No categories found</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
