import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Star, 
  MapPin, 
  Calendar, 
  ArrowRightLeft, 
  MessageCircle, 
  Edit3,
  CheckCircle,
  Loader2,
  Save,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  skill_offered: string | null;
  skill_wanted: string | null;
  created_at: string;
}

interface Review {
  id: string;
  reviewer: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ rating: 0, totalBarters: 0, completionRate: 0 });
  
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    location: "",
    skill_offered: "",
    skill_wanted: "",
  });

  const isOwnProfile = !userId || (user && profile?.user_id === user.id);

  useEffect(() => {
    if (!authLoading) {
      if (!userId && !user) {
        navigate("/auth");
        return;
      }
      fetchProfile();
    }
  }, [userId, user, authLoading]);

  const fetchProfile = async () => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (error) throw error;
      
      if (!profileData) {
        toast({
          title: "Profile not found",
          description: "This user doesn't exist",
          variant: "destructive",
        });
        navigate("/browse");
        return;
      }

      setProfile(profileData);
      setEditForm({
        full_name: profileData.full_name || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        skill_offered: profileData.skill_offered || "",
        skill_wanted: profileData.skill_wanted || "",
      });

      // Fetch ratings
      const { data: ratings } = await supabase
        .from("ratings")
        .select(`
          rating,
          review,
          created_at,
          rater_id
        `)
        .eq("rated_id", targetUserId);

      // Fetch barter stats
      const { data: barters } = await supabase
        .from("barter_requests")
        .select("status")
        .or(`requester_id.eq.${targetUserId},recipient_id.eq.${targetUserId}`);

      const completedBarters = barters?.filter(b => b.status === "completed").length || 0;
      const totalBarters = barters?.length || 0;

      setStats({
        rating: ratings?.length 
          ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length 
          : 0,
        totalBarters: completedBarters,
        completionRate: totalBarters > 0 
          ? Math.round((completedBarters / totalBarters) * 100) 
          : 100,
      });

      // Get reviewer profiles
      if (ratings && ratings.length > 0) {
        const reviewsWithProfiles: Review[] = await Promise.all(
          ratings.slice(0, 5).map(async (r) => {
            const { data: raterProfile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", r.rater_id)
              .maybeSingle();

            return {
              id: r.rater_id,
              reviewer: raterProfile?.full_name || "Anonymous",
              avatar: raterProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.rater_id}`,
              rating: r.rating,
              text: r.review || "Great experience!",
              date: new Date(r.created_at).toLocaleDateString(),
            };
          })
        );
        setReviews(reviewsWithProfiles);
      }

    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          bio: editForm.bio,
          location: editForm.location,
          skill_offered: editForm.skill_offered,
          skill_wanted: editForm.skill_wanted,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setEditing(false);
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card sticky top-24">
                {/* Avatar & Basic Info */}
                <div className="text-center mb-6">
                  <div className="relative inline-block mb-4">
                    <img
                      src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`}
                      alt={profile.full_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center border-2 border-background">
                      <CheckCircle className="w-5 h-5 text-secondary-foreground" />
                    </div>
                  </div>
                  
                  {editing ? (
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="text-center font-bold text-xl mb-2"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-foreground mb-1">{profile.full_name}</h1>
                  )}
                  
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    {editing ? (
                      <Input
                        value={editForm.location}
                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Your location"
                        className="h-8 text-sm"
                      />
                    ) : (
                      profile.location || "Location not set"
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xl font-bold text-foreground">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      {stats.rating > 0 ? stats.rating.toFixed(1) : "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{stats.totalBarters}</p>
                    <p className="text-xs text-muted-foreground">Barters</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{stats.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {isOwnProfile ? (
                    editing ? (
                      <div className="flex gap-2">
                        <Button variant="default" className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditing(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full gap-2" onClick={() => setEditing(true)}>
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    )
                  ) : (
                    <>
                      <Button variant="default" className="w-full gap-2">
                        <ArrowRightLeft className="w-4 h-4" />
                        Request Barter
                      </Button>
                      <Button variant="outline" className="w-full gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Send Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Bio */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
                {editing ? (
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about yourself..."
                    rows={4}
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.bio || "No bio yet."}</p>
                )}
              </div>

              {/* Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">O</span>
                    </div>
                    Skills I Offer
                  </h2>
                  {editing ? (
                    <Input
                      value={editForm.skill_offered}
                      onChange={(e) => setEditForm(prev => ({ ...prev, skill_offered: e.target.value }))}
                      placeholder="e.g., Guitar lessons, Web development"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.skill_offered ? (
                        <Badge variant="secondary" className="px-3 py-1.5">
                          {profile.skill_offered}
                        </Badge>
                      ) : (
                        <p className="text-muted-foreground text-sm">No skills listed yet</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <span className="text-accent font-bold">W</span>
                    </div>
                    Skills I Want
                  </h2>
                  {editing ? (
                    <Input
                      value={editForm.skill_wanted}
                      onChange={(e) => setEditForm(prev => ({ ...prev, skill_wanted: e.target.value }))}
                      placeholder="e.g., Spanish lessons, Photography"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.skill_wanted ? (
                        <Badge variant="outline" className="px-3 py-1.5">
                          {profile.skill_wanted}
                        </Badge>
                      ) : (
                        <p className="text-muted-foreground text-sm">No skills listed yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
                  <span className="text-sm text-muted-foreground">{reviews.length} reviews</span>
                </div>
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex gap-4">
                        <img
                          src={review.avatar}
                          alt={review.reviewer}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{review.reviewer}</span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-primary fill-primary" />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm mb-1">{review.text}</p>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No reviews yet</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
