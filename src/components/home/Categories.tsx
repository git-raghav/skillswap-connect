import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Code, 
  Music, 
  Palette, 
  Languages, 
  Dumbbell, 
  Camera, 
  ChefHat, 
  Briefcase 
} from "lucide-react";

const categories = [
  { icon: Code, name: "Technology", count: 2340, color: "bg-blue-500/10 text-blue-600" },
  { icon: Music, name: "Music", count: 1890, color: "bg-purple-500/10 text-purple-600" },
  { icon: Palette, name: "Art & Design", count: 1560, color: "bg-pink-500/10 text-pink-600" },
  { icon: Languages, name: "Languages", count: 2100, color: "bg-green-500/10 text-green-600" },
  { icon: Dumbbell, name: "Fitness", count: 980, color: "bg-orange-500/10 text-orange-600" },
  { icon: Camera, name: "Photography", count: 1240, color: "bg-cyan-500/10 text-cyan-600" },
  { icon: ChefHat, name: "Cooking", count: 890, color: "bg-red-500/10 text-red-600" },
  { icon: Briefcase, name: "Business", count: 1670, color: "bg-amber-500/10 text-amber-600" },
];

const Categories = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Popular Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore skills by category and find the perfect barter match
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/browse?category=${category.name.toLowerCase()}`}
                className="block p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count.toLocaleString()} skills</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
