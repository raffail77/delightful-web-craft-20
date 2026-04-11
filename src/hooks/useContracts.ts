import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ContractStatus = "proposed" | "pending_payment" | "accepted" | "in_progress" | "completed" | "disputed" | "cancelled";

export type PaymentMethod = "credits" | "stripe" | "both";

export interface Contract {
  id: string;
  service_id: string | null;
  provider_id: string;
  client_id: string;
  proposed_by: string;
  title: string;
  description: string;
  agreed_credits: number;
  status: ContractStatus;
  provider_confirmed: boolean;
  client_confirmed: boolean;
  transaction_id: string | null;
  payment_method: PaymentMethod;
  escrow_locked: boolean;
  escrow_locked_at: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function useContracts(otherUserId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContracts();

      const channel = supabase
        .channel("contracts-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "contracts" },
          (payload) => {
            const contract = payload.new as Contract;
            if (contract && (contract.provider_id === user.id || contract.client_id === user.id)) {
              fetchContracts();
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, otherUserId]);

  const fetchContracts = async () => {
    if (!user) return;

    let query = supabase
      .from("contracts")
      .select("*")
      .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (otherUserId) {
      query = supabase
        .from("contracts")
        .select("*")
        .or(
          `and(provider_id.eq.${user.id},client_id.eq.${otherUserId}),and(provider_id.eq.${otherUserId},client_id.eq.${user.id})`
        )
        .order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching contracts:", error);
    } else {
      setContracts((data as Contract[]) || []);
    }
    setIsLoading(false);
  };

  const acceptContract = async (contractId: string) => {
    if (!user) return { success: false };

    const { data, error } = await supabase.rpc('accept_contract_with_escrow', {
      p_contract_id: contractId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error accepting contract:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept contract",
        variant: "destructive",
      });
      return { success: false };
    }

    const result = data as { escrow_locked?: boolean; message?: string; requires_payment?: boolean } | null;
    
    if (result?.requires_payment) {
      toast({
        title: "Contract Accepted — Payment Required",
        description: "The client must complete Stripe payment before service can begin.",
      });
    } else {
      toast({
        title: "Contract Accepted",
        description: result?.escrow_locked
          ? "Credits have been locked in escrow. Service can now begin."
          : "The contract has been accepted.",
      });
    }

    await fetchContracts();
    return { success: true, requiresPayment: result?.requires_payment };
  };

  const payContractStripe = async (contractId: string) => {
    if (!user) return { success: false };

    try {
      const response = await supabase.functions.invoke("contract-stripe-payment", {
        body: { contract_id: contractId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Payment failed");
      }

      if (response.data?.url) {
        window.open(response.data.url, "_blank");
        toast({
          title: "Stripe Checkout Opened",
          description: "Complete your payment in the new tab. The contract will be activated once payment is confirmed.",
        });
        return { success: true };
      }

      throw new Error("No checkout URL received");
    } catch (error: any) {
      console.error("Stripe payment error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Could not initiate payment",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const startContract = async (contractId: string) => {
    const { error } = await supabase
      .from("contracts")
      .update({ status: "in_progress" })
      .eq("id", contractId);

    if (error) {
      console.error("Error starting contract:", error);
      toast({ title: "Error", description: "Failed to start contract", variant: "destructive" });
      return { success: false };
    }

    toast({ title: "Contract Started", description: "The service is now in progress." });
    return { success: true };
  };

  const confirmCompletion = async (contract: Contract) => {
    if (!user) return { success: false };

    const { data, error } = await supabase.rpc('complete_contract', {
      p_contract_id: contract.id,
      p_user_id: user.id
    });

    if (error) {
      console.error("Error confirming completion:", error);
      toast({ title: "Error", description: error.message || "Failed to confirm completion", variant: "destructive" });
      return { success: false };
    }

    const result = data as { completed?: boolean; message?: string } | null;
    
    if (result?.completed) {
      toast({
        title: "Contract Completed!",
        description: `${contract.agreed_credits} credits have been transferred to the provider`,
      });
    } else {
      toast({
        title: "Completion Confirmed",
        description: result?.message || "Waiting for the other party to confirm",
      });
    }

    await fetchContracts();
    return { success: true };
  };

  const cancelContract = async (contractId: string) => {
    if (!user) return { success: false };

    const { data, error } = await supabase.rpc('cancel_contract_with_escrow', {
      p_contract_id: contractId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error cancelling contract:", error);
      toast({ title: "Error", description: error.message || "Failed to cancel contract", variant: "destructive" });
      return { success: false };
    }

    toast({
      title: "Contract Cancelled",
      description: "The contract has been cancelled and any escrowed funds have been refunded.",
    });

    await fetchContracts();
    return { success: true };
  };

  return {
    contracts,
    isLoading,
    acceptContract,
    payContractStripe,
    startContract,
    confirmCompletion,
    cancelContract,
    refreshContracts: fetchContracts,
  };
}
