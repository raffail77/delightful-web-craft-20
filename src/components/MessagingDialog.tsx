import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MessageCircle, CreditCard, FileText } from "lucide-react";
import { format } from "date-fns";
import { useContracts } from "@/hooks/useContracts";
import PayCreditsDialog from "@/components/messaging/PayCreditsDialog";
import ContractProposalDialog from "@/components/messaging/ContractProposalDialog";
import ContractCard from "@/components/messaging/ContractCard";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  service_id: string | null;
}

interface MessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiverId: string;
  receiverName: string;
  serviceId?: string;
  serviceTitle?: string;
  hourlyCredits?: number;
  serviceType?: "offer" | "request";
  serviceOwnerId?: string;
  servicePaymentMethod?: "credits" | "stripe" | "both";
}

const MessagingDialog = ({
  open,
  onOpenChange,
  receiverId,
  receiverName,
  serviceId,
  serviceTitle,
  hourlyCredits,
  serviceType,
  serviceOwnerId,
  servicePaymentMethod,
}: MessagingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { contracts, isLoading: contractsLoading } = useContracts(receiverId);

  useEffect(() => {
    if (open && user) {
      fetchMessages();
      markAsRead();

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages-${user.id}-${receiverId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const newMsg = payload.new as Message;
            if (
              (newMsg.sender_id === user.id && newMsg.receiver_id === receiverId) ||
              (newMsg.sender_id === receiverId && newMsg.receiver_id === user.id)
            ) {
              setMessages((prev) => [...prev, newMsg]);
              if (newMsg.sender_id === receiverId) {
                markAsRead();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, user, receiverId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  const markAsRead = async () => {
    if (!user) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", receiverId)
      .eq("receiver_id", user.id)
      .eq("is_read", false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: newMessage.trim(),
      service_id: serviceId || null,
    });

    setSending(false);

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
  };

  const activeContracts = contracts.filter(
    (c) => !["completed", "cancelled"].includes(c.status)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md h-[650px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat with {receiverName}
            </DialogTitle>
            {serviceTitle && (
              <p className="text-sm text-muted-foreground">
                Regarding: {serviceTitle}
              </p>
            )}
          </DialogHeader>

          <Tabs defaultValue="messages" className="flex-1 flex flex-col min-h-0">
            <div className="px-6">
              <TabsList className="w-full">
                <TabsTrigger value="messages" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="contracts" className="flex-1">
                  <FileText className="w-4 h-4 mr-1" />
                  Contracts
                  {activeContracts.length > 0 && (
                    <span className="ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                      {activeContracts.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="messages" className="flex-1 flex flex-col min-h-0 mt-0 px-6">
              <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                <div className="space-y-4 py-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
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
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="space-y-3 pt-4 pb-6 border-t border-border">
                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowPayDialog(true)}
                  >
                    <CreditCard className="w-4 h-4 mr-1" />
                    Pay Credits
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowContractDialog(true)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Propose Contract
                  </Button>
                </div>

                {/* Message input */}
                <form onSubmit={handleSend} className="flex gap-2">
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
              </div>
            </TabsContent>

            <TabsContent value="contracts" className="flex-1 min-h-0 mt-0 pb-6 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 min-h-0 px-6">
                <div className="space-y-3 py-4">
                  {contractsLoading ? (
                    <div className="text-center text-muted-foreground py-8">
                      Loading contracts...
                    </div>
                  ) : contracts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No contracts yet</p>
                      <p className="text-sm">Create a contract to formalize your service agreement</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setShowContractDialog(true)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Propose Contract
                      </Button>
                    </div>
                  ) : (
                    contracts.map((contract) => (
                      <ContractCard key={contract.id} contract={contract} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Pay Credits Dialog */}
      <PayCreditsDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        receiverId={receiverId}
        receiverName={receiverName}
        serviceId={serviceId}
        serviceTitle={serviceTitle}
        suggestedAmount={hourlyCredits}
      />

      {/* Contract Proposal Dialog */}
      <ContractProposalDialog
        open={showContractDialog}
        onOpenChange={setShowContractDialog}
        receiverId={receiverId}
        receiverName={receiverName}
        serviceId={serviceId}
        serviceTitle={serviceTitle}
        suggestedCredits={hourlyCredits}
        serviceType={serviceType}
        serviceOwnerId={serviceOwnerId}
        servicePaymentMethod={servicePaymentMethod}
      />
    </>
  );
};

export default MessagingDialog;
