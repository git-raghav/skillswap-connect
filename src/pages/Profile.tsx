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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  X,
  Languages,
  Plus,
  Award,
  User as UserIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AvatarUpload from "@/components/profile/AvatarUpload";
import ProofUpload from "@/components/profile/ProofUpload";
import ReportUserDialog from "@/components/profile/ReportUserDialog";
import BarterPortfolio from "@/components/profile/BarterPortfolio";
import OnboardingDialog from "@/components/onboarding/OnboardingDialog";
import ShareProfileButton from "@/components/profile/ShareProfileButton";
import OnlineIndicator from "@/components/ui/OnlineIndicator";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";

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
  languages: string[];
  proof_links: ProofLink[];
  onboarding_completed: boolean;
  gender: string | null;
}

interface ProofLink {
  id: string;
  title: string;
  url: string;
}

interface Proof {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
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
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ rating: 0, totalBarters: 0, completionRate: 0 });
  const [newLanguage, setNewLanguage] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    location: "",
    skill_offered: "",
    skill_wanted: "",
    languages: [] as string[],
    proof_links: [] as ProofLink[],
    gender: "",
  });

  const isOwnProfile = !userId || (user && profile?.user_id === user.id);
  const targetUserId = userId || user?.id;

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

      const parsedProfile: ProfileData = {
        ...profileData,
        languages: Array.isArray(profileData.languages) ? (profileData.languages as string[]) : [],
        proof_links: Array.isArray(profileData.proof_links) ? (profileData.proof_links as unknown as ProofLink[]) : [],
        onboarding_completed: profileData.onboarding_completed ?? true,
        gender: profileData.gender ?? null,
      };

      setProfile(parsedProfile);
      
      // Show onboarding for new users viewing their own profile
      if (isOwnProfile && !parsedProfile.onboarding_completed) {
        setShowOnboarding(true);
      }

      setEditForm({
        full_name: parsedProfile.full_name || "",
        bio: parsedProfile.bio || "",
        location: parsedProfile.location || "",
        skill_offered: parsedProfile.skill_offered || "",
        skill_wanted: parsedProfile.skill_wanted || "",
        languages: parsedProfile.languages || [],
        proof_links: parsedProfile.proof_links || [],
        gender: parsedProfile.gender || "",
      });
      
      // Fetch skill level and tags
      const { data: skillData } = await supabase
        .from("skills")
        .select("skill_level, tags")
        .eq("user_id", targetUserId)
        .eq("skill_type", "offered")
        .maybeSingle();
      
      if (skillData) {
        setSkillLevel(skillData.skill_level || "intermediate");
        setSkillTags((skillData.tags as string[]) || []);
      }

      // Fetch proofs
      const { data: proofsData } = await supabase
        .from("user_proofs")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      setProofs(proofsData || []);

      // Fetch ratings
      const { data: ratings } = await supabase
        .from("ratings")
        .select(`rating, review, created_at, rater_id`)
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
          languages: editForm.languages,
          proof_links: JSON.parse(JSON.stringify(editForm.proof_links)),
          gender: editForm.gender || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { 
        ...prev, 
        ...editForm,
      } : null);
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

  const handleAvatarUpdate = (url: string) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
  };

  const handleRequestBarter = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase.from("barter_requests").insert({
        requester_id: user.id,
        recipient_id: profile.user_id,
        message: `Hi! I'd like to exchange skills with you.`,
      });

      if (error) throw error;
      toast({ title: "Request sent!", description: `Your request has been sent to ${profile.full_name}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !editForm.languages.includes(newLanguage.trim())) {
      setEditForm(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage("");
    }
  };

  const removeLanguage = (lang: string) => {
    setEditForm(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang)
    }));
  };

  const handleProofLinksChange = (links: ProofLink[]) => {
    setEditForm(prev => ({ ...prev, proof_links: links }));
  };

  const addTag = () => {
    if (newTag.trim() && !skillTags.includes(newTag.trim())) {
      setSkillTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setSkillTags(prev => prev.filter(t => t !== tag));
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
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
                    <AvatarUpload
                      currentAvatarUrl={profile.avatar_url}
                      userId={profile.user_id}
                      userName={profile.full_name}
                      onUploadComplete={handleAvatarUpdate}
                      editable={isOwnProfile && editing}
                    />
                    {!editing && (
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center border-2 border-background">
                        <CheckCircle className="w-5 h-5 text-secondary-foreground" />
                      </div>
                    )}
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

                {/* Gender */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Gender</span>
                  </div>
                  {editing ? (
                    <Select 
                      value={editForm.gender || "not_specified"} 
                      onValueChange={(v) => setEditForm(prev => ({ ...prev, gender: v === "not_specified" ? "" : v }))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_specified">Prefer not to say</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non_binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground capitalize">
                      {profile.gender?.replace("_", " ") || "Not specified"}
                    </span>
                  )}
                </div>

                {/* Languages */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Languages</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editing ? (
                      <>
                        {editForm.languages.map((lang) => (
                          <Badge key={lang} variant="secondary" className="gap-1">
                            {lang}
                            <button onClick={() => removeLanguage(lang)}>
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                        <div className="flex gap-1 w-full mt-2">
                          <Input
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            placeholder="Add language"
                            className="h-8 text-sm flex-1"
                            onKeyDown={(e) => e.key === "Enter" && addLanguage()}
                          />
                          <Button size="sm" variant="outline" onClick={addLanguage}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      profile.languages.length > 0 ? (
                        profile.languages.map((lang) => (
                          <Badge key={lang} variant="secondary">{lang}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No languages set</span>
                      )
                    )}
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
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => setEditing(true)}>
                          <Edit3 className="w-4 h-4" />
                          Edit Profile
                        </Button>
                        <ShareProfileButton userId={profile.user_id} userName={profile.full_name} />
                      </div>
                    )
                  ) : (
                    <>
                      <Button variant="default" className="w-full gap-2" onClick={handleRequestBarter}>
                        <ArrowRightLeft className="w-4 h-4" />
                        Request Barter
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate("/messages")}>
                          <MessageCircle className="w-4 h-4" />
                          Message
                        </Button>
                        <ShareProfileButton userId={profile.user_id} userName={profile.full_name} />
                      </div>
                      <ReportUserDialog 
                        reportedUserId={profile.user_id} 
                        reportedUserName={profile.full_name} 
                      />
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
                    <div className="space-y-4">
                      <Input
                        value={editForm.skill_offered}
                        onChange={(e) => setEditForm(prev => ({ ...prev, skill_offered: e.target.value }))}
                        placeholder="e.g., Guitar lessons, Web development"
                      />
                      <div className="space-y-2">
                        <Label className="text-sm">Skill Level</Label>
                        <Select value={skillLevel} onValueChange={setSkillLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {skillTags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              {tag}
                              <button onClick={() => removeTag(tag)}>
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag"
                            className="h-8 text-sm"
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          />
                          <Button size="sm" variant="outline" onClick={addTag}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {profile.skill_offered ? (
                          <>
                            <Badge variant="secondary" className="px-3 py-1.5">
                              {profile.skill_offered}
                            </Badge>
                            <Badge variant="outline" className="px-2 py-1 text-xs capitalize">
                              <Award className="w-3 h-3 mr-1" />
                              {skillLevel}
                            </Badge>
                          </>
                        ) : (
                          <p className="text-muted-foreground text-sm">No skills listed yet</p>
                        )}
                      </div>
                      {skillTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {skillTags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
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

              {/* Proofs/Certificates */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <ProofUpload
                  userId={profile.user_id}
                  proofs={proofs}
                  proofLinks={editing ? editForm.proof_links : profile.proof_links}
                  onProofsChange={setProofs}
                  onProofLinksChange={handleProofLinksChange}
                  editable={isOwnProfile && editing}
                />
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
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-foreground">{review.reviewer}</h4>
                            <span className="text-xs text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? "text-primary fill-primary"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No reviews yet.</p>
                )}
              </div>

              {/* Barter Portfolio */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <BarterPortfolio userId={profile.user_id} />
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Onboarding Dialog */}
      <OnboardingDialog open={showOnboarding} onComplete={handleOnboardingComplete} />
    </div>
  );
};

export default Profile;