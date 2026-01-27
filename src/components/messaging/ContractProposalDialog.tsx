import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, AlertCircle } from "lucide-react";
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
  onSuccess,
}: ContractProposalDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(serviceTitle || "");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState<string>(suggestedCredits?.toString() || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePropose = async () => {
    if (!user) return;

    const numCredits = parseInt(credits);
    
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

    setSending(true);
    setError(null);

    // Determine provider and client based on service type:
    // - Offering service: service owner = provider, other user = client
    // - Requesting service: service owner = client, other user = provider
    // If no service type, the proposer becomes the client (requesting work)
    let providerId: string;
    let clientId: string;

    if (serviceType && serviceOwnerId) {
      if (serviceType === "offer") {
        // Service owner is offering work, so they are the provider
        providerId = serviceOwnerId;
        clientId = serviceOwnerId === user.id ? receiverId : user.id;
      } else {
        // Service owner is requesting work, so they are the client
        clientId = serviceOwnerId;
        providerId = serviceOwnerId === user.id ? receiverId : user.id;
      }
    } else {
      // Fallback: proposer is the client (requesting work from receiver)
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
    });

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

    // Reset form
    setTitle(serviceTitle || "");
    setDescription("");
    setCredits(suggestedCredits?.toString() || "");
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
            <Label htmlFor="credits">Agreed Credits</Label>
            <Input
              id="credits"
              type="number"
              min="1"
              placeholder="Number of credits"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              Credits will be transferred when both parties confirm completion
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">How contracts work:</p>
            <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
              <li>Both parties must accept the proposal</li>
              <li>Service is marked "in progress" once accepted</li>
              <li>Both confirm completion to release payment</li>
              <li>Credits transfer automatically on mutual confirmation</li>
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
