import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";

export type ContractStatus = "proposed" | "accepted" | "in_progress" | "completed" | "disputed" | "cancelled";

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
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function useContracts(otherUserId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { transferCredits } = useCredits();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContracts();

      // Subscribe to realtime updates
      const channel = supabase
        .channel("contracts-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "contracts",
          },
          (payload) => {
            const contract = payload.new as Contract;
            if (
              contract &&
              (contract.provider_id === user.id || contract.client_id === user.id)
            ) {
              fetchContracts();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, otherUserId]);

  const fetchContracts = async () => {
    if (!user) return;

    let query = supabase
      .from("contracts")
      .select("*")
      .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    // Filter by other user if provided
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

    const { error } = await supabase
      .from("contracts")
      .update({ status: "accepted" })
      .eq("id", contractId)
      .neq("proposed_by", user.id); // Only the other party can accept

    if (error) {
      console.error("Error accepting contract:", error);
      toast({
        title: "Error",
        description: "Failed to accept contract",
        variant: "destructive",
      });
      return { success: false };
    }

    toast({
      title: "Contract Accepted",
      description: "The contract has been accepted. Service can now begin.",
    });

    return { success: true };
  };

  const startContract = async (contractId: string) => {
    const { error } = await supabase
      .from("contracts")
      .update({ status: "in_progress" })
      .eq("id", contractId);

    if (error) {
      console.error("Error starting contract:", error);
      toast({
        title: "Error",
        description: "Failed to start contract",
        variant: "destructive",
      });
      return { success: false };
    }

    toast({
      title: "Contract Started",
      description: "The service is now in progress.",
    });

    return { success: true };
  };

  const confirmCompletion = async (contract: Contract) => {
    if (!user) return { success: false };

    const isProvider = contract.provider_id === user.id;
    const updateField = isProvider ? "provider_confirmed" : "client_confirmed";
    const otherConfirmed = isProvider ? contract.client_confirmed : contract.provider_confirmed;

    // Update confirmation
    const { error: updateError } = await supabase
      .from("contracts")
      .update({ [updateField]: true })
      .eq("id", contract.id);

    if (updateError) {
      console.error("Error confirming completion:", updateError);
      toast({
        title: "Error",
        description: "Failed to confirm completion",
        variant: "destructive",
      });
      return { success: false };
    }

    // If both confirmed, process payment
    if (otherConfirmed) {
      // Client pays provider
      const result = await transferCredits(
        contract.provider_id,
        contract.agreed_credits,
        contract.service_id || undefined,
        `Contract payment: ${contract.title}`
      );

      if (result.success) {
        // Update contract to completed with transaction ID
        await supabase
          .from("contracts")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            transaction_id: result.transactionId,
          })
          .eq("id", contract.id);

        toast({
          title: "Contract Completed!",
          description: `${contract.agreed_credits} credits have been transferred`,
        });
      } else {
        toast({
          title: "Payment Failed",
          description: "Could not process the credit transfer",
          variant: "destructive",
        });
        return { success: false };
      }
    } else {
      toast({
        title: "Completion Confirmed",
        description: "Waiting for the other party to confirm",
      });
    }

    return { success: true };
  };

  const cancelContract = async (contractId: string) => {
    const { error } = await supabase
      .from("contracts")
      .update({ status: "cancelled" })
      .eq("id", contractId);

    if (error) {
      console.error("Error cancelling contract:", error);
      toast({
        title: "Error",
        description: "Failed to cancel contract",
        variant: "destructive",
      });
      return { success: false };
    }

    toast({
      title: "Contract Cancelled",
      description: "The contract has been cancelled",
    });

    return { success: true };
  };

  return {
    contracts,
    isLoading,
    acceptContract,
    startContract,
    confirmCompletion,
    cancelContract,
    refreshContracts: fetchContracts,
  };
}
