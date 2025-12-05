import { motion } from "framer-motion";
import SkillCard from "@/components/skills/SkillCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const featuredSkills = [
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
];

const FeaturedSkills = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Featured Skill Exchanges
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover what people are bartering right now
            </p>
          </div>
          <Link to="/browse">
            <Button variant="outline" className="gap-2">
              View All Skills
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredSkills.map((skill) => (
            <SkillCard key={skill.id} {...skill} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSkills;
