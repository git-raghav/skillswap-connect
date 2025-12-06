import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Star, ArrowRightLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CompletedBarter {
  id: string;
  partnerName: string;
  partnerAvatar: string;
  skillExchanged: string;
  completedAt: string;
  rating: number | null;
}

interface BarterPortfolioProps {
  userId: string;
}

const BarterPortfolio = ({ userId }: BarterPortfolioProps) => {
  const [barters, setBarters] = useState<CompletedBarter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedBarters();
  }, [userId]);

  const fetchCompletedBarters = async () => {
    try {
      // Fetch completed barters
      const { data: barterRequests } = await supabase
        .from("barter_requests")
        .select("*")
        .eq("status", "completed")
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (!barterRequests) {
        setLoading(false);
        return;
      }

      const completedBarters: CompletedBarter[] = await Promise.all(
        barterRequests.map(async (barter) => {
          const partnerId = barter.requester_id === userId ? barter.recipient_id : barter.requester_id;

          // Get partner profile
          const { data: partnerProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, skill_offered")
            .eq("user_id", partnerId)
            .maybeSingle();

          // Get rating for this barter
          const { data: ratingData } = await supabase
            .from("ratings")
            .select("rating")
            .eq("barter_id", barter.id)
            .eq("rated_id", userId)
            .maybeSingle();

          return {
            id: barter.id,
            partnerName: partnerProfile?.full_name || "Unknown",
            partnerAvatar: partnerProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerId}`,
            skillExchanged: partnerProfile?.skill_offered || "Skills",
            completedAt: barter.updated_at,
            rating: ratingData?.rating || null,
          };
        })
      );

      setBarters(completedBarters);
    } catch (error) {
      console.error("Error fetching completed barters:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (barters.length === 0) {
    return (
      <div className="text-center py-8">
        <ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No completed barters yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Barter Portfolio
        </h3>
        <Badge variant="secondary">{barters.length} completed</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {barters.slice(0, 6).map((barter, index) => (
          <motion.div
            key={barter.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={barter.partnerAvatar}
                    alt={barter.partnerName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{barter.partnerName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Exchanged: {barter.skillExchanged}
                    </p>
                  </div>
                  <div className="text-right">
                    {barter.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-sm font-medium">{barter.rating}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(barter.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {barters.length > 6 && (
        <p className="text-sm text-muted-foreground text-center">
          And {barters.length - 6} more completed barters...
        </p>
      )}
    </div>
  );
};

export default BarterPortfolio;
