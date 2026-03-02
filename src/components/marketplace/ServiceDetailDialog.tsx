import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  MapPin,
  Wifi,
  User,
  MessageCircle,
  ExternalLink,
  Star,
  Briefcase,
  Award,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
    profiles?: { full_name: string | null; avatar_url?: string | null; headline?: string | null } | null;
    avgRating?: number;
    reviewCount?: number;
  } | null;
  currentUserId?: string;
  onContact?: () => void;
}

interface FreelancerProfile {
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  about: string | null;
  location: string | null;
  availability_status: string | null;
  skills: string[] | null;
  is_verified: boolean;
}

interface FreelancerSkill {
  id: string;
  skill_name: string;
  proficiency_level: number;
  endorsement_count: number;
}

interface FreelancerReview {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  reviewer?: { full_name: string | null; avatar_url: string | null };
}

const ServiceDetailDialog = ({
  open,
  onOpenChange,
  service,
  currentUserId,
  onContact,
}: ServiceDetailDialogProps) => {
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
  const [freelancerSkills, setFreelancerSkills] = useState<FreelancerSkill[]>([]);
  const [freelancerReviews, setFreelancerReviews] = useState<FreelancerReview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && service) {
      fetchFreelancerData(service.user_id);
    }
  }, [open, service?.user_id]);

  const fetchFreelancerData = async (userId: string) => {
    setLoading(true);

    const [{ data: profile }, { data: skills }, { data: reviews }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url, headline, bio, about, location, availability_status, skills, is_verified")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_skills")
        .select("id, skill_name, proficiency_level, endorsement_count")
        .eq("user_id", userId)
        .order("endorsement_count", { ascending: false })
        .limit(10),
      supabase
        .from("reviews")
        .select("id, rating, title, content, created_at, reviewer_id")
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    setFreelancerProfile(profile as FreelancerProfile | null);
    setFreelancerSkills((skills as FreelancerSkill[]) || []);

    // Fetch reviewer profiles
    if (reviews && reviews.length > 0) {
      const reviewerIds = reviews.map((r: any) => r.reviewer_id);
      const { data: reviewerProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", reviewerIds);

      const enriched = reviews.map((r: any) => ({
        ...r,
        reviewer: reviewerProfiles?.find((p: any) => p.user_id === r.reviewer_id) || null,
      }));
      setFreelancerReviews(enriched);
    } else {
      setFreelancerReviews([]);
    }

    setLoading(false);
  };

  if (!service) return null;

  const showContact = currentUserId && service.user_id !== currentUserId;
  const contactLabel = service.service_type === "offer" ? "Contact Provider" : "Contact Receiver";
  const initials = freelancerProfile?.full_name
    ? freelancerProfile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-gold fill-gold" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header banner */}
        <div className="bg-gradient-navy p-6 pb-8 text-primary-foreground">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`text-xs ${service.service_type === "offer" ? "bg-emerald-500/90 text-white hover:bg-emerald-500" : "bg-sky-500/90 text-white hover:bg-sky-500"}`}>
              {service.service_type === "offer" ? "Offering" : "Requesting"}
            </Badge>
            <Badge variant="outline" className="text-xs text-primary-foreground/70 border-primary-foreground/30">
              {service.category}
            </Badge>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-primary-foreground leading-snug">
              {service.title}
            </DialogTitle>
          </DialogHeader>

          {/* Rating + credits row */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span className="font-semibold">
                {service.avgRating ? service.avgRating.toFixed(1) : "New"}
              </span>
              {(service.reviewCount ?? 0) > 0 && (
                <span className="text-primary-foreground/60">({service.reviewCount} reviews)</span>
              )}
            </div>
            <Separator orientation="vertical" className="h-4 bg-primary-foreground/20" />
            <div className="flex items-center gap-1 font-semibold text-gold">
              <Clock className="w-4 h-4" />
              {service.hourly_credits} credit{service.hourly_credits !== 1 ? "s" : ""}/hr
            </div>
            {service.is_remote && (
              <>
                <Separator orientation="vertical" className="h-4 bg-primary-foreground/20" />
                <span className="flex items-center gap-1 text-primary-foreground/70">
                  <Wifi className="w-3.5 h-3.5" /> Remote
                </span>
              </>
            )}
            {service.location && (
              <>
                <Separator orientation="vertical" className="h-4 bg-primary-foreground/20" />
                <span className="flex items-center gap-1 text-primary-foreground/70">
                  <MapPin className="w-3.5 h-3.5" /> {service.location}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <section>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" /> About This Service
            </h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {service.description}
            </p>
          </section>

          <Separator />

          {/* Freelancer profile section */}
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-48" />
                </div>
              </div>
            </div>
          ) : freelancerProfile && (
            <section className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> About the Freelancer
              </h4>

              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-border">
                  <AvatarImage src={freelancerProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{freelancerProfile.full_name || "Anonymous"}</span>
                    {freelancerProfile.is_verified && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-500 border-emerald-500/30">
                        Verified
                      </Badge>
                    )}
                  </div>
                  {freelancerProfile.headline && (
                    <p className="text-sm text-muted-foreground">{freelancerProfile.headline}</p>
                  )}
                  {freelancerProfile.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {freelancerProfile.location}
                    </p>
                  )}
                  {service.service_type === "offer" && (
                    <a
                      href={`/profile/${service.user_id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-gold transition-colors mt-1"
                    >
                      View Full Profile <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {(freelancerProfile.about || freelancerProfile.bio) && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {freelancerProfile.about || freelancerProfile.bio}
                </p>
              )}

              {/* Skills */}
              {freelancerSkills.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Skills
                  </h5>
                  <div className="space-y-2">
                    {freelancerSkills.slice(0, 6).map((skill) => (
                      <div key={skill.id} className="flex items-center gap-3">
                        <span className="text-sm w-28 truncate">{skill.skill_name}</span>
                        <Progress value={(skill.proficiency_level || 3) * 20} className="flex-1 h-1.5" />
                        {skill.endorsement_count > 0 && (
                          <span className="text-[10px] text-muted-foreground">{skill.endorsement_count} endorsements</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Reviews */}
          {freelancerReviews.length > 0 && (
            <>
              <Separator />
              <section>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold" /> Reviews ({service.reviewCount || freelancerReviews.length})
                </h4>
                <div className="space-y-4">
                  {freelancerReviews.map((review) => (
                    <div key={review.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {review.reviewer?.full_name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{review.reviewer?.full_name || "Anonymous"}</span>
                          {renderStars(review.rating)}
                        </div>
                        {review.title && <p className="text-sm font-medium mt-0.5">{review.title}</p>}
                        {review.content && (
                          <p className="text-sm text-muted-foreground mt-0.5">{review.content}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Contact button */}
          {showContact && onContact && (
            <Button variant="gold" className="w-full gap-2" onClick={onContact}>
              <MessageCircle className="w-4 h-4" />
              {contactLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailDialog;
