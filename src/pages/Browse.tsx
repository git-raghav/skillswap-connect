import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SkillCard from "@/components/skills/SkillCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";

const allSkills = [
  {
    id: "1",
    userName: "Alex Rivera",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    skillOffered: "Guitar Lessons",
    skillWanted: "Web Development",
    rating: 4.9,
    reviews: 47,
    location: "San Francisco",
    category: "Music",
  },
  {
    id: "2",
    userName: "Maya Chen",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    skillOffered: "Python Programming",
    skillWanted: "Spanish Language",
    rating: 5.0,
    reviews: 32,
    location: "New York",
    category: "Technology",
  },
  {
    id: "3",
    userName: "Jordan Kim",
    userAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
    skillOffered: "Photography",
    skillWanted: "Cooking Classes",
    rating: 4.8,
    reviews: 28,
    location: "Los Angeles",
    category: "Creative",
  },
  {
    id: "4",
    userName: "Sam Patel",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    skillOffered: "Yoga Instruction",
    skillWanted: "Graphic Design",
    rating: 4.7,
    reviews: 56,
    location: "Austin",
    category: "Fitness",
  },
  {
    id: "5",
    userName: "Emma Wilson",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    skillOffered: "French Language",
    skillWanted: "Piano Lessons",
    rating: 4.9,
    reviews: 41,
    location: "Chicago",
    category: "Languages",
  },
  {
    id: "6",
    userName: "Marcus Johnson",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    skillOffered: "Basketball Coaching",
    skillWanted: "Video Editing",
    rating: 4.6,
    reviews: 23,
    location: "Miami",
    category: "Sports",
  },
  {
    id: "7",
    userName: "Lisa Zhang",
    userAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    skillOffered: "UI/UX Design",
    skillWanted: "Japanese Language",
    rating: 5.0,
    reviews: 38,
    location: "Seattle",
    category: "Design",
  },
  {
    id: "8",
    userName: "David Brown",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    skillOffered: "Financial Planning",
    skillWanted: "Meditation Classes",
    rating: 4.8,
    reviews: 29,
    location: "Boston",
    category: "Business",
  },
];

const categories = ["All", "Technology", "Music", "Creative", "Fitness", "Languages", "Sports", "Design", "Business"];

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredSkills = allSkills.filter((skill) => {
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
            Showing {filteredSkills.length} results
          </motion.p>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSkills.map((skill, index) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <SkillCard {...skill} />
              </motion.div>
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-xl text-muted-foreground mb-4">No skills found matching your criteria</p>
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
