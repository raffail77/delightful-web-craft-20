import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useCredits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCredits();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel("profile-credits")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new && typeof payload.new === "object" && "time_credits" in payload.new) {
              setCredits(payload.new.time_credits as number);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setCredits(0);
      setIsLoading(false);
    }
  }, [user]);

  const fetchCredits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("time_credits")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setCredits(data?.time_credits || 0);
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const transferCredits = async (
    receiverId: string,
    amount: number,
    serviceId?: string,
    description?: string
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to transfer credits",
        variant: "destructive",
      });
      return { success: false, error: "Not authenticated" };
    }

    if (amount > credits) {
      toast({
        title: "Insufficient Credits",
        description: `You have ${credits} credits but tried to send ${amount}`,
        variant: "destructive",
      });
      return { success: false, error: "Insufficient credits" };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("transfer-credits", {
        body: {
          receiver_id: receiverId,
          amount,
          service_id: serviceId,
          description,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Transfer failed");
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Transfer failed");
      }

      toast({
        title: "Transfer Successful",
        description: `Sent ${amount} credits successfully`,
      });

      // Refresh credits
      await fetchCredits();

      return { success: true, transactionId: response.data.transaction_id };
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Could not complete the transfer",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    credits,
    isLoading,
    transferCredits,
    refreshCredits: fetchCredits,
  };
}
