import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barterId: string;
  ratedUserId: string;
  ratedUserName: string;
  onRatingComplete: () => void;
}

const RatingDialog = ({ 
  open, 
  onOpenChange, 
  barterId, 
  ratedUserId, 
  ratedUserName,
  onRatingComplete 
}: RatingDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("ratings").insert({
        rater_id: user.id,
        rated_id: ratedUserId,
        barter_id: barterId,
        rating,
        review: review.trim() || null,
      });

      if (error) throw error;

      toast({ title: "Rating submitted!", description: "Thank you for your feedback." });
      onOpenChange(false);
      onRatingComplete();
      setRating(0);
      setReview("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate your experience with {ratedUserName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex flex-col items-center">
            <Label className="mb-3">How would you rate this barter?</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "text-primary fill-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground mt-2">
              {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""}` : "Select a rating"}
            </span>
          </div>
          <div>
            <Label htmlFor="review">Write a review (optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Rating
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
