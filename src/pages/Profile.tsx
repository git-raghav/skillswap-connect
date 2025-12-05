import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MapPin, 
  Calendar, 
  ArrowRightLeft, 
  MessageCircle, 
  Edit3,
  CheckCircle
} from "lucide-react";

const Profile = () => {
  const user = {
    name: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    location: "San Francisco, CA",
    joinedDate: "January 2024",
    bio: "Passionate musician with 10 years of guitar experience. Love teaching beginners and intermediate players. Currently learning web development to build my own music platform.",
    rating: 4.9,
    totalBarters: 47,
    completionRate: 98,
    skillsOffered: ["Guitar Lessons", "Music Theory", "Songwriting"],
    skillsWanted: ["Web Development", "React.js", "UI/UX Design"],
    verified: true,
  };

  const reviews = [
    {
      id: "1",
      reviewer: "Maya Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      text: "Alex is an amazing guitar teacher! Very patient and explains concepts clearly. Highly recommend!",
      date: "2 weeks ago",
    },
    {
      id: "2",
      reviewer: "Jordan Kim",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      text: "Great barter experience. Learned so much about music theory in exchange for photography tips.",
      date: "1 month ago",
    },
  ];

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
                      src={user.avatar}
                      alt={user.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                    />
                    {user.verified && (
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center border-2 border-background">
                        <CheckCircle className="w-5 h-5 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">{user.name}</h1>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Joined {user.joinedDate}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xl font-bold text-foreground">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      {user.rating}
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{user.totalBarters}</p>
                    <p className="text-xs text-muted-foreground">Barters</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{user.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button variant="default" className="w-full gap-2">
                    <ArrowRightLeft className="w-4 h-4" />
                    Request Barter
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Send Message
                  </Button>
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
                <p className="text-muted-foreground">{user.bio}</p>
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
                  <div className="flex flex-wrap gap-2">
                    {user.skillsOffered.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1.5">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <span className="text-accent font-bold">W</span>
                    </div>
                    Skills I Want
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {user.skillsWanted.map((skill) => (
                      <Badge key={skill} variant="outline" className="px-3 py-1.5">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
                  <span className="text-sm text-muted-foreground">{reviews.length} reviews</span>
                </div>
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
