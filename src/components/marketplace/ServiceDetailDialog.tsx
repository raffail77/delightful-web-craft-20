import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Wifi, User, MessageCircle, ExternalLink } from "lucide-react";

interface ServiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    title: string;
    description: string;
    category: string;
    service_type: "offer" | "request";
    hourly_credits: number;
    is_remote: boolean;
    location: string | null;
    user_id: string;
    created_at: string;
    profiles?: { full_name: string | null } | null;
  } | null;
  currentUserId?: string;
  onContact?: () => void;
}

const ServiceDetailDialog = ({
  open,
  onOpenChange,
  service,
  currentUserId,
  onContact,
}: ServiceDetailDialogProps) => {
  if (!service) return null;

  const showContact = currentUserId && service.user_id !== currentUserId;
  const contactLabel = service.service_type === "offer" ? "Contact Provider" : "Contact Receiver";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                service.service_type === "offer"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {service.service_type === "offer" ? "Offering" : "Requesting"}
            </span>
            <span className="text-xs text-muted-foreground">{service.category}</span>
          </div>
          <DialogTitle className="text-xl font-serif leading-snug">
            {service.title}
          </DialogTitle>
        </DialogHeader>

        {/* Provider info */}
        {service.profiles?.full_name && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Posted by {service.profiles.full_name}</span>
            </div>
            {service.service_type === "offer" && (
              <a
                href={`/profile/${service.user_id}`}
                className="flex items-center gap-1 text-primary hover:text-gold transition-colors text-xs"
              >
                View Profile
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Full description */}
        <div className="glass-card p-4 rounded-xl">
          <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gold font-semibold">
            <Clock className="w-4 h-4" />
            {service.hourly_credits} credit{service.hourly_credits !== 1 ? "s" : ""}/hr
          </div>
          {service.is_remote && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Wifi className="w-4 h-4" />
              Remote
            </span>
          )}
          {service.location && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {service.location}
            </span>
          )}
        </div>

        {/* Contact button */}
        {showContact && onContact && (
          <Button variant="gold" className="w-full gap-2 mt-2" onClick={onContact}>
            <MessageCircle className="w-4 h-4" />
            {contactLabel}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailDialog;
