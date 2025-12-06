import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search, Loader2, MessageCircle, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ScheduleMeetingDialog from "@/components/messages/ScheduleMeetingDialog";
import MediaUpload from "@/components/messages/MediaUpload";
import MessageBubble from "@/components/messages/MessageBubble";

interface ScheduledMeeting {
  title: string;
  date: string;
  time: string;
  meetLink: string;
}

interface MediaAttachment {
  url: string;
  type: string;
  name: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  message_type?: string;
  scheduled_meeting?: ScheduledMeeting | null;
  media?: MediaAttachment | null;
}

interface Conversation {
  id: string;
  barterId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<MediaAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchConversations();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!selectedConvo) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${selectedConvo.barterId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `barter_id=eq.${selectedConvo.barterId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          const parsedMsg: Message = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            content: newMsg.content,
            created_at: newMsg.created_at,
            message_type: newMsg.message_type || "text",
            scheduled_meeting: newMsg.scheduled_meeting,
            media: newMsg.payload?.media || null,
          };
          setSelectedConvo(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...prev.messages, parsedMsg],
              lastMessage: parsedMsg.content || "Media attachment",
            };
          });
          setConversations(prev => 
            prev.map(c => 
              c.barterId === selectedConvo.barterId 
                ? { ...c, lastMessage: parsedMsg.content || "Media attachment", timestamp: "Just now" }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvo?.barterId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConvo?.messages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all accepted barter requests
      const { data: barters, error } = await supabase
        .from("barter_requests")
        .select("*")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      if (!barters || barters.length === 0) {
        setLoading(false);
        return;
      }

      // Get profiles for other users
      const otherUserIds = barters.map(b => 
        b.requester_id === user.id ? b.recipient_id : b.requester_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", otherUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      // Get messages for each barter
      const convos: Conversation[] = await Promise.all(
        barters.map(async (barter) => {
          const otherUserId = barter.requester_id === user.id 
            ? barter.recipient_id 
            : barter.requester_id;
          const otherProfile = profileMap.get(otherUserId);

          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .eq("barter_id", barter.id)
            .order("created_at", { ascending: true });

          const parsedMessages: Message[] = (messages || []).map((m: any) => ({
            id: m.id,
            sender_id: m.sender_id,
            content: m.content,
            created_at: m.created_at,
            message_type: m.message_type || "text",
            scheduled_meeting: m.scheduled_meeting,
            media: m.payload?.media || null,
          }));

          const lastMsg = parsedMessages[parsedMessages.length - 1];

          return {
            id: otherUserId,
            barterId: barter.id,
            user: {
              id: otherUserId,
              name: otherProfile?.full_name || "Anonymous",
              avatar: otherProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`,
            },
            lastMessage: lastMsg?.content || "No messages yet",
            timestamp: lastMsg ? getRelativeTime(lastMsg.created_at) : "",
            messages: parsedMessages,
          };
        })
      );

      setConversations(convos);
      if (convos.length > 0) {
        setSelectedConvo(convos[0]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !pendingMedia) || !selectedConvo || !user || sending) return;

    setSending(true);
    try {
      const messageContent = newMessage.trim() || (pendingMedia ? `Sent ${pendingMedia.type}` : "");
      
      const { error } = await supabase.from("messages").insert({
        barter_id: selectedConvo.barterId,
        sender_id: user.id,
        content: messageContent,
        message_type: pendingMedia ? "media" : "text",
        ...(pendingMedia && { payload: { media: pendingMedia } as any }),
      } as any);

      if (error) throw error;
      setNewMessage("");
      setPendingMedia(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleScheduleMeeting = async (meeting: ScheduledMeeting) => {
    if (!selectedConvo || !user) return;

    try {
      const { error } = await supabase.from("messages").insert({
        barter_id: selectedConvo.barterId,
        sender_id: user.id,
        content: `Scheduled: ${meeting.title}`,
        message_type: "meeting",
        scheduled_meeting: meeting as any,
      } as any);

      if (error) throw error;
    } catch (error) {
      console.error("Error scheduling meeting:", error);
    }
  };

  const handleMediaUpload = (media: MediaAttachment) => {
    setPendingMedia(media);
  };

  const filteredConversations = conversations.filter((convo) =>
    convo.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">No conversations yet</h1>
            <p className="text-muted-foreground mb-6">
              Accept a barter request to start chatting with other users
            </p>
            <Button onClick={() => navigate("/requests")}>View Requests</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 h-screen">
        <div className="h-[calc(100vh-64px)] flex">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 border-r border-border bg-card flex flex-col"
          >
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConvo(convo)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border ${
                    selectedConvo?.id === convo.id ? "bg-muted/50" : ""
                  }`}
                >
                  <img
                    src={convo.user.avatar}
                    alt={convo.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{convo.user.name}</span>
                      <span className="text-xs text-muted-foreground">{convo.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Chat Area */}
          {selectedConvo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col"
            >
              {/* Chat Header */}
              <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedConvo.user.avatar}
                    alt={selectedConvo.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">{selectedConvo.user.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ScheduleMeetingDialog onSchedule={handleScheduleMeeting} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open("https://meet.google.com/new", "_blank")}
                    title="Start instant video call"
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedConvo.messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  selectedConvo.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      content={message.content}
                      isOwn={message.sender_id === user?.id}
                      timestamp={getRelativeTime(message.created_at)}
                      messageType={message.message_type}
                      scheduledMeeting={message.scheduled_meeting}
                      media={message.media}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Pending Media Preview */}
              {pendingMedia && (
                <div className="px-4 py-2 border-t border-border bg-muted/50">
                  <div className="flex items-center gap-3">
                    {pendingMedia.type === "image" ? (
                      <img
                        src={pendingMedia.url}
                        alt={pendingMedia.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">FILE</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pendingMedia.name}</p>
                      <p className="text-xs text-muted-foreground">Ready to send</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingMedia(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                  <MediaUpload
                    userId={user?.id || ""}
                    barterId={selectedConvo.barterId}
                    onUpload={handleMediaUpload}
                    disabled={sending}
                  />
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={(!newMessage.trim() && !pendingMedia) || sending}>
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
