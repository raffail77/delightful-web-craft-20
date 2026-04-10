import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Contract, useContracts } from "@/hooks/useContracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { 
  FileText, 
  Check, 
  X, 
  Play, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Star,
  DollarSign,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewDialog } from "@/components/profile/ReviewDialog";

interface ContractCardProps {
  contract: Contract;
  onAction?: () => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  proposed: { label: "Proposed", variant: "secondary", icon: FileText },
  accepted: { label: "Accepted", variant: "default", icon: Check },
  in_progress: { label: "In Progress", variant: "default", icon: Play },
  completed: { label: "Completed", variant: "outline", icon: CheckCircle2 },
  disputed: { label: "Disputed", variant: "destructive", icon: AlertTriangle },
  cancelled: { label: "Cancelled", variant: "secondary", icon: X },
};

const ContractCard = ({ contract, onAction }: ContractCardProps) => {
  const { user } = useAuth();
  const { acceptContract, startContract, confirmCompletion, cancelContract } = useContracts();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [otherPartyName, setOtherPartyName] = useState("User");

  if (!user) return null;

  const isProvider = contract.provider_id === user.id;
  const isProposer = contract.proposed_by === user.id;
  const myConfirmed = isProvider ? contract.provider_confirmed : contract.client_confirmed;
  const otherConfirmed = isProvider ? contract.client_confirmed : contract.provider_confirmed;

  const status = statusConfig[contract.status] || statusConfig.proposed;
  const StatusIcon = status.icon;

  // The person to review is the other party
  const revieweeId = isProvider ? contract.client_id : contract.provider_id;

  // Check if user has already reviewed this contract
  useEffect(() => {
    const checkReview = async () => {
      if (contract.status !== "completed") return;

      const { data } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_id", user.id)
        .eq("contract_id", contract.id)
        .maybeSingle();

      setHasReviewed(!!data);
    };

    checkReview();
  }, [contract.id, contract.status, user.id]);

  // Fetch other party's name
  useEffect(() => {
    const fetchName = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", revieweeId)
        .maybeSingle();

      if (data?.full_name) {
        setOtherPartyName(data.full_name);
      }
    };

    fetchName();
  }, [revieweeId]);

  const handleAccept = async () => {
    await acceptContract(contract.id);
    onAction?.();
  };

  const handleStart = async () => {
    await startContract(contract.id);
    onAction?.();
  };

  const handleConfirm = async () => {
    await confirmCompletion(contract);
    onAction?.();
  };

  const handleCancel = async () => {
    await cancelContract(contract.id);
    onAction?.();
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium line-clamp-1">
              {contract.title}
            </CardTitle>
            <Badge variant={status.variant} className="flex items-center gap-1 shrink-0">
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {contract.description}
          </p>

          {/* Role and payment method indicators */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {isProvider ? "You are the Provider" : "You are the Client"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {contract.payment_method === "credits" && <><Clock className="w-3 h-3 mr-1" />Credits</>}
              {contract.payment_method === "stripe" && <><DollarSign className="w-3 h-3 mr-1" />Stripe</>}
              {contract.payment_method === "both" && <><CreditCard className="w-3 h-3 mr-1" />Credits (preferred)</>}
            </Badge>
            {contract.escrow_locked && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />Escrow
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Created {format(new Date(contract.created_at), "MMM d, yyyy")}
          </div>

          {/* Status indicator for in_progress contracts */}
          {contract.status === "in_progress" && (
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3" />
              <span>
                {myConfirmed && otherConfirmed
                  ? "Processing payment..."
                  : isProvider
                  ? contract.client_confirmed
                    ? "Waiting for payment"
                    : "Service in progress"
                  : contract.provider_confirmed
                  ? "Work completed - ready for payment"
                  : "Provider working..."}
              </span>
            </div>
          )}

          {/* Action buttons based on status and role */}
          <div className="flex gap-2 pt-2">
            {/* Proposed status - acceptor can accept, proposer can withdraw */}
            {contract.status === "proposed" && !isProposer && (
              <>
                <Button size="sm" variant="gold" onClick={handleAccept} className="flex-1">
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-3 h-3" />
                </Button>
              </>
            )}

            {contract.status === "proposed" && isProposer && (
              <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                <X className="w-3 h-3 mr-1" />
                Withdraw
              </Button>
            )}

            {/* Accepted status - PROVIDER starts the service */}
            {contract.status === "accepted" && isProvider && (
              <Button size="sm" variant="gold" onClick={handleStart} className="flex-1">
                <Play className="w-3 h-3 mr-1" />
                Start Service
              </Button>
            )}

            {contract.status === "accepted" && !isProvider && (
              <Button size="sm" variant="outline" disabled className="flex-1">
                <Clock className="w-3 h-3 mr-1" />
                Waiting to Start
              </Button>
            )}

            {/* In Progress - PROVIDER marks complete, CLIENT pays after completion */}
            {contract.status === "in_progress" && isProvider && !contract.provider_confirmed && (
              <Button size="sm" variant="gold" onClick={handleConfirm} className="flex-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Mark Complete
              </Button>
            )}

            {contract.status === "in_progress" && isProvider && contract.provider_confirmed && (
              <Button size="sm" variant="outline" disabled className="flex-1">
                <Clock className="w-3 h-3 mr-1" />
                Awaiting Payment
              </Button>
            )}

            {contract.status === "in_progress" && !isProvider && !contract.provider_confirmed && (
              <Button size="sm" variant="outline" disabled className="flex-1">
                <Play className="w-3 h-3 mr-1" />
                In Progress
              </Button>
            )}

            {contract.status === "in_progress" && !isProvider && contract.provider_confirmed && !contract.client_confirmed && (
              <Button size="sm" variant="gold" onClick={handleConfirm} className="flex-1">
                <CreditCard className="w-3 h-3 mr-1" />
                Pay Credits
              </Button>
            )}

            {contract.status === "in_progress" && contract.provider_confirmed && contract.client_confirmed && (
              <Button size="sm" variant="outline" disabled className="flex-1">
                <Clock className="w-3 h-3 mr-1" />
                Processing...
              </Button>
            )}

            {/* Completed status - Show review button ONLY to clients (payers), not providers */}
            {contract.status === "completed" && !isProvider && !hasReviewed && (
              <Button size="sm" variant="gold" onClick={() => setReviewOpen(true)} className="flex-1">
                <Star className="w-3 h-3 mr-1" />
                Leave Review
              </Button>
            )}

            {contract.status === "completed" && !isProvider && hasReviewed && (
              <Button size="sm" variant="outline" disabled className="flex-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Reviewed
              </Button>
            )}

            {contract.status === "completed" && isProvider && (
              <Button size="sm" variant="outline" disabled className="flex-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        contractId={contract.id}
        reviewerId={user.id}
        revieweeId={revieweeId}
        revieweeName={otherPartyName}
        onComplete={() => setHasReviewed(true)}
      />
    </>
  );
};

export default ContractCard;
