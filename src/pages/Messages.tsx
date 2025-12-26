import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import { MessageCircle, Send, ArrowLeft, User } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  service_id: string | null;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchConversations();

      const channel = supabase
        .channel("messages-inbox")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          () => {
            fetchConversations();
            if (selectedConversation) {
              fetchMessages(selectedConversation);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    // Get all messages involving the user
    const { data: messagesData, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
      return;
    }

    // Group by conversation partner
    const conversationMap = new Map<string, { messages: Message[]; unread: number }>();

    messagesData?.forEach((msg) => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, { messages: [], unread: 0 });
      }
      const conv = conversationMap.get(partnerId)!;
      conv.messages.push(msg);
      if (!msg.is_read && msg.receiver_id === user.id) {
        conv.unread++;
      }
    });

    // Fetch partner profiles
    const partnerIds = Array.from(conversationMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", partnerIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

    const conversationList: Conversation[] = Array.from(conversationMap.entries()).map(
      ([partnerId, data]) => ({
        partnerId,
        partnerName: profileMap.get(partnerId) || "User",
        lastMessage: data.messages[0]?.content || "",
        lastMessageTime: data.messages[0]?.created_at || "",
        unreadCount: data.unread,
      })
    );

    // Sort by last message time
    conversationList.sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    setConversations(conversationList);
    setLoading(false);
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      
      fetchConversations();
    }
  };

  const handleSelectConversation = (partnerId: string) => {
    setSelectedConversation(partnerId);
    fetchMessages(partnerId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim()) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedConversation,
      content: newMessage.trim(),
    });

    setSending(false);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }
  };

  const selectedPartner = conversations.find((c) => c.partnerId === selectedConversation);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8">Messages</h1>

          <div className="glass-card rounded-xl overflow-hidden h-[600px] flex">
            {/* Conversations List */}
            <div
              className={`w-full md:w-1/3 border-r border-border flex flex-col ${
                selectedConversation ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Conversations</h2>
              </div>
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                          <div className="h-3 bg-muted rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">
                      Contact a service provider to start chatting
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {conversations.map((conv) => (
                      <button
                        key={conv.partnerId}
                        onClick={() => handleSelectConversation(conv.partnerId)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex gap-3 ${
                          selectedConversation === conv.partnerId ? "bg-muted" : ""
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-navy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">{conv.partnerName}</span>
                            {conv.unreadCount > 0 && (
                              <span className="bg-gold text-navy text-xs font-bold px-2 py-0.5 rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conv.lastMessageTime), "MMM d, HH:mm")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div
              className={`flex-1 flex flex-col ${
                selectedConversation ? "flex" : "hidden md:flex"
              }`}
            >
              {selectedConversation && selectedPartner ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                      <User className="w-5 h-5 text-navy" />
                    </div>
                    <span className="font-semibold">{selectedPartner.partnerName}</span>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.sender_id === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender_id === user?.id
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {format(new Date(message.created_at), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <form
                    onSubmit={handleSend}
                    className="p-4 border-t border-border flex gap-2"
                  >
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={sending || !newMessage.trim()}
                      variant="gold"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a conversation</p>
                    <p className="text-sm">Choose from your existing conversations</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;
