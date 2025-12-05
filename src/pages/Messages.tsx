import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search, Phone, Video, MoreVertical } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  user: {
    name: string;
    avatar: string;
    online: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

const conversations: Conversation[] = [
  {
    id: "1",
    user: {
      name: "Maya Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      online: true,
    },
    lastMessage: "Sounds good! Let's schedule for next week",
    timestamp: "2m ago",
    unread: 2,
    messages: [
      { id: "1", senderId: "maya", text: "Hey! I saw your guitar lessons offer", timestamp: "10:00 AM" },
      { id: "2", senderId: "me", text: "Hi Maya! Yes, I'd love to exchange skills with you", timestamp: "10:05 AM" },
      { id: "3", senderId: "maya", text: "Great! I can teach Python in exchange", timestamp: "10:06 AM" },
      { id: "4", senderId: "me", text: "That sounds perfect. When are you available?", timestamp: "10:10 AM" },
      { id: "5", senderId: "maya", text: "Sounds good! Let's schedule for next week", timestamp: "10:12 AM" },
    ],
  },
  {
    id: "2",
    user: {
      name: "Jordan Kim",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face",
      online: false,
    },
    lastMessage: "The photography session was amazing!",
    timestamp: "1h ago",
    unread: 0,
    messages: [
      { id: "1", senderId: "jordan", text: "Thanks for the music theory lesson!", timestamp: "Yesterday" },
      { id: "2", senderId: "me", text: "You're welcome! You're a quick learner", timestamp: "Yesterday" },
      { id: "3", senderId: "jordan", text: "The photography session was amazing!", timestamp: "1h ago" },
    ],
  },
  {
    id: "3",
    user: {
      name: "Sam Patel",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      online: true,
    },
    lastMessage: "Looking forward to the yoga class!",
    timestamp: "3h ago",
    unread: 0,
    messages: [
      { id: "1", senderId: "sam", text: "Hi! Excited about our barter", timestamp: "Today" },
      { id: "2", senderId: "me", text: "Me too! Ready to learn yoga", timestamp: "Today" },
      { id: "3", senderId: "sam", text: "Looking forward to the yoga class!", timestamp: "3h ago" },
    ],
  },
];

const Messages = () => {
  const [selectedConvo, setSelectedConvo] = useState<Conversation>(conversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((convo) =>
    convo.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (!newMessage.trim()) return;
    // In a real app, this would send to backend
    setNewMessage("");
  };

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
                    selectedConvo.id === convo.id ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={convo.user.avatar}
                      alt={convo.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {convo.user.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{convo.user.name}</span>
                      <span className="text-xs text-muted-foreground">{convo.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                  </div>
                  {convo.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {convo.unread}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Chat Area */}
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
                  <span className="text-xs text-muted-foreground">
                    {selectedConvo.user.online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedConvo.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.senderId === "me"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className={`text-xs mt-1 block ${
                      message.senderId === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
