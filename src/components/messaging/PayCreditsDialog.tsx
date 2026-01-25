import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCredits } from "@/hooks/useCredits";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreditCard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PayCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiverId: string;
  receiverName: string;
  serviceId?: string;
  serviceTitle?: string;
  suggestedAmount?: number;
  onSuccess?: () => void;
}

const PayCreditsDialog = ({
  open,
  onOpenChange,
  receiverId,
  receiverName,
  serviceId,
  serviceTitle,
  suggestedAmount,
  onSuccess,
}: PayCreditsDialogProps) => {
  const { credits, transferCredits, isLoading } = useCredits();
  const [amount, setAmount] = useState<string>(suggestedAmount?.toString() || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    const numAmount = parseInt(amount);
    
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (numAmount > credits) {
      setError(`Insufficient credits. You have ${credits} credits.`);
      return;
    }

    setSending(true);
    setError(null);

    const result = await transferCredits(
      receiverId,
      numAmount,
      serviceId,
      serviceTitle ? `Payment for: ${serviceTitle}` : `Payment to ${receiverName}`
    );

    setSending(false);

    if (result.success) {
      setAmount("");
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError(result.error || "Payment failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Pay Credits
          </DialogTitle>
          <DialogDescription>
            Send time credits to {receiverName}
            {serviceTitle && (
              <span className="block mt-1 text-xs">For: {serviceTitle}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Your balance: <span className="font-semibold text-foreground">{credits} credits</span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount to send</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={credits}
              placeholder="Enter credits amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={sending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button 
            variant="gold" 
            onClick={handlePayment} 
            disabled={sending || isLoading || !amount}
          >
            {sending ? "Sending..." : `Pay ${amount || 0} Credits`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayCreditsDialog;
