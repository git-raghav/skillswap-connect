import { useState } from "react";
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
  ArrowRightLeft 
} from "lucide-react";

interface BarterRequest {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  skillOffered: string;
  skillWanted: string;
  status: "pending" | "accepted" | "declined" | "completed";
  date: string;
  type: "incoming" | "outgoing";
}

const requests: BarterRequest[] = [
  {
    id: "1",
    user: {
      name: "Maya Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
    skillOffered: "Python Programming",
    skillWanted: "Guitar Lessons",
    status: "pending",
    date: "2 hours ago",
    type: "incoming",
  },
  {
    id: "2",
    user: {
      name: "Jordan Kim",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face",
    },
    skillOffered: "Photography",
    skillWanted: "Music Theory",
    status: "accepted",
    date: "1 day ago",
    type: "incoming",
  },
  {
    id: "3",
    user: {
      name: "Sam Patel",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    },
    skillOffered: "Guitar Lessons",
    skillWanted: "Yoga Instruction",
    status: "pending",
    date: "3 days ago",
    type: "outgoing",
  },
  {
    id: "4",
    user: {
      name: "Emma Wilson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    },
    skillOffered: "French Language",
    skillWanted: "Guitar Lessons",
    status: "completed",
    date: "1 week ago",
    type: "incoming",
  },
];

const statusConfig = {
  pending: { icon: Clock, color: "bg-amber-500/10 text-amber-600", label: "Pending" },
  accepted: { icon: CheckCircle, color: "bg-green-500/10 text-green-600", label: "Accepted" },
  declined: { icon: XCircle, color: "bg-red-500/10 text-red-600", label: "Declined" },
  completed: { icon: CheckCircle, color: "bg-secondary/10 text-secondary", label: "Completed" },
};

const Requests = () => {
  const [activeTab, setActiveTab] = useState("all");

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
              <div className="flex items-center gap-2 text-sm">
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
                    <Button size="sm" variant="default">Accept</Button>
                    <Button size="sm" variant="outline">Decline</Button>
                  </>
                )}
                {request.status === "accepted" && (
                  <Button size="sm" variant="soft" className="gap-1">
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Button>
                )}
                {request.status === "pending" && request.type === "outgoing" && (
                  <Button size="sm" variant="ghost">Cancel</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

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
                  <p className="text-lg text-muted-foreground">No requests found</p>
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
