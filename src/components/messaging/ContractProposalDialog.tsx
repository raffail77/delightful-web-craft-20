import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, AlertCircle, CreditCard, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContractProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiverId: string;
  receiverName: string;
  serviceId?: string;
  serviceTitle?: string;
  suggestedCredits?: number;
  serviceType?: "offer" | "request";
  serviceOwnerId?: string;
  servicePaymentMethod?: "credits" | "stripe" | "both";
  onSuccess?: () => void;
}

const ContractProposalDialog = ({
  open,
  onOpenChange,
  receiverId,
  receiverName,
  serviceId,
  serviceTitle,
  suggestedCredits,
  serviceType,
  serviceOwnerId,
  servicePaymentMethod,
  onSuccess,
}: ContractProposalDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { credits } = useCredits();
  const [title, setTitle] = useState(serviceTitle || "");
  const [description, setDescription] = useState("");
  const [creditsAmount, setCreditsAmount] = useState<string>(suggestedCredits?.toString() || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"credits" | "stripe">(
    servicePaymentMethod === "stripe" ? "stripe" : "credits"
  );

  // Reset payment method when service payment method changes
  useEffect(() => {
    if (servicePaymentMethod === "stripe") {
      setSelectedPaymentMethod("stripe");
    } else if (servicePaymentMethod === "credits") {
      setSelectedPaymentMethod("credits");
    } else {
      setSelectedPaymentMethod("credits");
    }
  }, [servicePaymentMethod]);

  const effectivePaymentMethod = servicePaymentMethod || "credits";
  const canChoosePayment = effectivePaymentMethod === "both";

  // Determine the final payment method for the contract
  const finalPaymentMethod = canChoosePayment ? selectedPaymentMethod : effectivePaymentMethod;

  const handlePropose = async () => {
    if (!user) return;

    const numCredits = parseInt(creditsAmount);
    
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the service terms");
      return;
    }

    if (!numCredits || numCredits <= 0) {
      setError("Please enter a valid credit amount");
      return;
    }

    // For credit-based payments, check if the client has enough credits
    if (finalPaymentMethod === "credits") {
      let clientId: string;
      if (serviceType && serviceOwnerId) {
        clientId = serviceType === "offer"
          ? (serviceOwnerId === user.id ? receiverId : user.id)
          : serviceOwnerId;
      } else {
        clientId = user.id;
      }

      if (clientId === user.id && credits < numCredits) {
        setError(`Insufficient credits. You have ${credits} credits but need ${numCredits}. Please earn or purchase more credits.`);
        return;
      }
    }

    setSending(true);
    setError(null);

    let providerId: string;
    let clientId: string;

    if (serviceType && serviceOwnerId) {
      if (serviceType === "offer") {
        providerId = serviceOwnerId;
        clientId = serviceOwnerId === user.id ? receiverId : user.id;
      } else {
        clientId = serviceOwnerId;
        providerId = serviceOwnerId === user.id ? receiverId : user.id;
      }
    } else {
      providerId = receiverId;
      clientId = user.id;
    }

    const { error: insertError } = await supabase.from("contracts").insert({
      service_id: serviceId || null,
      provider_id: providerId,
      client_id: clientId,
      proposed_by: user.id,
      title: title.trim(),
      description: description.trim(),
      agreed_credits: numCredits,
      status: "proposed",
      payment_method: finalPaymentMethod,
    } as any);

    setSending(false);

    if (insertError) {
      console.error("Error creating contract:", insertError);
      setError("Failed to create contract proposal");
      return;
    }

    toast({
      title: "Contract Proposed",
      description: `Your contract proposal has been sent to ${receiverName}`,
    });

    setTitle(serviceTitle || "");
    setDescription("");
    setCreditsAmount(suggestedCredits?.toString() || "");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Propose Service Contract
          </DialogTitle>
          <DialogDescription>
            Create a formal agreement with {receiverName} for service exchange
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              placeholder="e.g., Web Design Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Service Terms & Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what will be delivered, timeline, and any conditions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={sending}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">
              {finalPaymentMethod === "stripe" ? "Agreed Amount (in credits equivalent)" : "Agreed Credits"}
            </Label>
            <Input
              id="credits"
              type="number"
              min="1"
              placeholder="Number of credits"
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(e.target.value)}
              disabled={sending}
            />
            {finalPaymentMethod === "credits" && (
              <p className="text-xs text-muted-foreground">
                Your balance: <span className="font-semibold">{credits} credits</span>. Credits will be locked in escrow when the contract is accepted.
              </p>
            )}
            {finalPaymentMethod === "stripe" && (
              <p className="text-xs text-muted-foreground">
                Payment will be processed via Stripe. The amount will be held in escrow until service completion.
              </p>
            )}
          </div>

          {/* Payment method selection - only shown when service supports both */}
          {canChoosePayment && (
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={(val) => setSelectedPaymentMethod(val as "credits" | "stripe")}
                disabled={sending}
              >
                <div className="flex items-center space-x-2 p-2 rounded-md border border-border hover:bg-muted/50">
                  <RadioGroupItem value="credits" id="pm-credits" />
                  <Label htmlFor="pm-credits" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Time Credits</p>
                      <p className="text-xs text-muted-foreground">Pay with your credit balance</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-md border border-border hover:bg-muted/50">
                  <RadioGroupItem value="stripe" id="pm-stripe" />
                  <Label htmlFor="pm-stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Stripe (Cash)</p>
                      <p className="text-xs text-muted-foreground">Pay via Stripe checkout</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Payment method indicator when fixed */}
          {!canChoosePayment && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
              {effectivePaymentMethod === "credits" ? (
                <CreditCard className="w-4 h-4 text-primary" />
              ) : (
                <DollarSign className="w-4 h-4 text-green-600" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {effectivePaymentMethod === "credits" ? "Credits Only" : "Stripe Payment Only"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Payment method set by the service listing
                </p>
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">How contracts work:</p>
            <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
              <li>Both parties must accept the proposal</li>
              {finalPaymentMethod === "credits" ? (
                <li>Credits are locked in escrow when the contract is accepted</li>
              ) : (
                <li>Stripe payment is required before service can begin</li>
              )}
              <li>Provider starts the service after escrow is secured</li>
              <li>Both confirm completion to release payment</li>
              <li>Unpaid Stripe contracts are auto-cancelled after 48 hours</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handlePropose} disabled={sending}>
            {sending ? "Sending..." : "Send Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractProposalDialog;
