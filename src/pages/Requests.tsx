import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageCircle,
  ArrowRightLeft,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface BarterRequest {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  skillOffered: string;
  skillWanted: string;
  status: "pending" | "accepted" | "declined" | "completed";
  date: string;
  type: "incoming" | "outgoing";
  message: string;
}

const statusConfig = {
  pending: { icon: Clock, color: "bg-amber-500/10 text-amber-600", label: "Pending" },
  accepted: { icon: CheckCircle, color: "bg-green-500/10 text-green-600", label: "Accepted" },
  declined: { icon: XCircle, color: "bg-red-500/10 text-red-600", label: "Declined" },
  completed: { icon: CheckCircle, color: "bg-secondary/10 text-secondary", label: "Completed" },
};

const Requests = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [requests, setRequests] = useState<BarterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchRequests();
    }
  }, [user, authLoading]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("barter_requests")
        .select("*")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profiles for all users involved
      const userIds = new Set<string>();
      data?.forEach(req => {
        userIds.add(req.requester_id);
        userIds.add(req.recipient_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, skill_offered, skill_wanted")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const formattedRequests: BarterRequest[] = (data || []).map(req => {
        const isIncoming = req.recipient_id === user.id;
        const otherUserId = isIncoming ? req.requester_id : req.recipient_id;
        const otherProfile = profileMap.get(otherUserId);
        const myProfile = profileMap.get(user.id);

        return {
          id: req.id,
          user: {
            id: otherUserId,
            name: otherProfile?.full_name || "Anonymous",
            avatar: otherProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`,
          },
          skillOffered: isIncoming 
            ? (otherProfile?.skill_offered || "Their skill") 
            : (myProfile?.skill_offered || "Your skill"),
          skillWanted: isIncoming 
            ? (myProfile?.skill_offered || "Your skill")
            : (otherProfile?.skill_offered || "Their skill"),
          status: req.status as BarterRequest["status"],
          date: getRelativeTime(req.created_at),
          type: isIncoming ? "incoming" : "outgoing",
          message: req.message || "",
        };
      });

      setRequests(formattedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("barter_requests")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: "accepted" } : r
      ));
      toast({ title: "Request accepted!", description: "You can now start chatting." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("barter_requests")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: "declined" } : r
      ));
      toast({ title: "Request declined" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("barter_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast({ title: "Request cancelled" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "all") return true;
    if (activeTab === "incoming") return req.type === "incoming";
    if (activeTab === "outgoing") return req.type === "outgoing";
    return true;
  });

  const RequestCard = ({ request }: { request: BarterRequest }) => {
    const status = statusConfig[request.status];
    const StatusIcon = status.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-hover transition-all"
      >
        <div className="flex items-start gap-4">
          <img
            src={request.user.avatar}
            alt={request.user.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-primary/10"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">{request.user.name}</h3>
              <Badge variant="secondary" className={`${status.color} shrink-0`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-muted-foreground">Offers:</span>
                <span className="font-medium text-foreground">{request.skillOffered}</span>
                <ArrowRightLeft className="w-4 h-4 text-primary mx-2" />
                <span className="text-muted-foreground">Wants:</span>
                <span className="font-medium text-foreground">{request.skillWanted}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{request.date}</span>
              <div className="flex gap-2">
                {request.status === "pending" && request.type === "incoming" && (
                  <>
                    <Button size="sm" variant="default" onClick={() => handleAccept(request.id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecline(request.id)}>
                      Decline
                    </Button>
                  </>
                )}
                {request.status === "accepted" && (
                  <Button 
                    size="sm" 
                    variant="soft" 
                    className="gap-1"
                    onClick={() => navigate("/messages")}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Button>
                )}
                {request.status === "pending" && request.type === "outgoing" && (
                  <Button size="sm" variant="ghost" onClick={() => handleCancel(request.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Barter Requests
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your incoming and outgoing barter requests
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="incoming">Incoming</TabsTrigger>
              <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <div className="text-center py-16 bg-card rounded-2xl border border-border">
                  <ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {requests.length === 0 
                      ? "No barter requests yet. Start by browsing skills!"
                      : "No requests found in this category"}
                  </p>
                  {requests.length === 0 && (
                    <Button className="mt-4" onClick={() => navigate("/browse")}>
                      Browse Skills
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Requests;
