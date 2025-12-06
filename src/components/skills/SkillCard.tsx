import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, ArrowRightLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/useFavorites";
import OnlineIndicator from "@/components/ui/OnlineIndicator";

interface SkillCardProps {
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
  onRequestBarter?: () => void;
  showFavorite?: boolean;
  isOnline?: boolean;
}

const SkillCard = ({
  userName,
  userAvatar,
  skillOffered,
  skillWanted,
  rating,
  reviews,
  location,
  category,
  userId,
  onRequestBarter,
  showFavorite = true,
  isOnline = false,
}: SkillCardProps) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(userId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-hover transition-all duration-300 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <button 
          onClick={() => navigate(`/profile/${userId}`)}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <img
              src={userAvatar}
              alt={userName}
              className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
            />
            <OnlineIndicator isOnline={isOnline} size="sm" className="bottom-0 right-0" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground hover:text-primary transition-colors">{userName}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {location}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {showFavorite && (
            <button
              onClick={() => toggleFavorite(userId)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <Heart className={`w-5 h-5 ${favorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
          )}
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>
      </div>

      {/* Skills Exchange */}
      <div className="bg-muted/50 rounded-xl p-4 mb-4 flex-1">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Offers</p>
            <p className="font-medium text-foreground line-clamp-2">{skillOffered}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs text-muted-foreground mb-1">Wants</p>
            <p className="font-medium text-foreground line-clamp-2">{skillWanted}</p>
          </div>
        </div>
      </div>

      {/* Rating & Action */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({reviews})</span>
        </div>
        <Button variant="soft" size="sm" onClick={onRequestBarter}>
          Request Barter
        </Button>
      </div>
    </motion.div>
  );
};

export default SkillCard;
