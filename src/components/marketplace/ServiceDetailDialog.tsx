import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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
  MessageCircle,
  ExternalLink,
  Star,
  Award,
  Shield,
  CheckCircle2,
  Zap,
  Globe,
  ThumbsUp,
  Users,
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
  response_time_hours: number | null;
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
  const [completedContracts, setCompletedContracts] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && service) {
      fetchFreelancerData(service.user_id);
    }
  }, [open, service?.user_id]);

  const fetchFreelancerData = async (userId: string) => {
    setLoading(true);

    const [{ data: profile }, { data: skills }, { data: reviews }, { count }] = await Promise.all([
      supabase
        .from("profiles_public")
        .select("full_name, avatar_url, headline, bio, about, location, availability_status, skills, is_verified, response_time_hours")
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
        .limit(6),
      supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
        .eq("status", "completed"),
    ]);

    setFreelancerProfile(profile as FreelancerProfile | null);
    setFreelancerSkills((skills as FreelancerSkill[]) || []);
    setCompletedContracts(count || 0);

    if (reviews && reviews.length > 0) {
      const reviewerIds = reviews.map((r: any) => r.reviewer_id);
      const { data: reviewerProfiles } = await supabase
        .from("profiles_public")
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
        <Star key={s} className={`w-4 h-4 ${s <= rating ? "text-gold fill-gold" : "text-muted-foreground/20"}`} />
      ))}
    </div>
  );

  const ratingDistribution = () => {
    const dist = [0, 0, 0, 0, 0];
    freelancerReviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    });
    return dist.reverse();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-0">
        {/* ─── Hero Banner ─── */}
        <div className="relative bg-gradient-navy px-8 pt-8 pb-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`text-xs font-medium ${service.service_type === "offer" ? "bg-emerald-500/90 text-white hover:bg-emerald-500" : "bg-sky-500/90 text-white hover:bg-sky-500"}`}>
                  {service.service_type === "offer" ? "✦ Offering" : "✦ Requesting"}
                </Badge>
                <Badge variant="outline" className="text-xs text-primary-foreground/60 border-primary-foreground/20 bg-primary-foreground/5">
                  {service.category}
                </Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-foreground leading-tight">
                {service.title}
              </h2>

              {/* Quick stats row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-primary-foreground/70 pt-1">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  <span className="font-semibold text-primary-foreground">
                    {service.avgRating ? service.avgRating.toFixed(1) : "New"}
                  </span>
                  {(service.reviewCount ?? 0) > 0 && (
                    <span>({service.reviewCount})</span>
                  )}
                </div>
                {service.is_remote && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> Remote Available
                  </span>
                )}
                {service.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {service.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Posted {format(new Date(service.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing card floating over banner edge */}
          <div className="absolute -bottom-10 right-8 bg-card border border-border rounded-xl shadow-elevated p-5 min-w-[200px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Starting at</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gold">{service.hourly_credits}</span>
              <span className="text-sm text-muted-foreground">credits/hr</span>
            </div>
            {showContact && onContact && (
              <Button variant="gold" className="w-full gap-2 mt-3" size="sm" onClick={onContact}>
                <MessageCircle className="w-4 h-4" />
                {contactLabel}
              </Button>
            )}
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="px-8 pt-16 pb-8 space-y-8">

          {/* Two-column layout on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* ─── Left Column: Service Details ─── */}
            <div className="md:col-span-2 space-y-8">

              {/* About this service */}
              <section className="space-y-3">
                <h3 className="text-lg font-serif font-semibold">About This Service</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {service.description}
                </p>
              </section>

              {/* Service features */}
              <section className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">What's Included</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Clock, label: `${service.hourly_credits} credit${service.hourly_credits !== 1 ? "s" : ""}/hr rate` },
                    { icon: service.is_remote ? Wifi : MapPin, label: service.is_remote ? "Remote delivery" : (service.location || "On-site") },
                    { icon: Zap, label: "Quick response" },
                    { icon: Shield, label: "Secure payment" },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <feat.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span>{feat.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ─── Reviews Section ─── */}
              {freelancerReviews.length > 0 && (
                <section className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-serif font-semibold flex items-center gap-2">
                      <Star className="w-5 h-5 text-gold fill-gold" />
                      Reviews
                      <span className="text-sm font-normal text-muted-foreground">
                        ({service.reviewCount || freelancerReviews.length})
                      </span>
                    </h3>
                  </div>

                  {/* Rating breakdown bar */}
                  {freelancerReviews.length >= 2 && (
                    <div className="flex items-center gap-6 p-4 rounded-xl border border-border bg-muted/20">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-foreground">
                          {service.avgRating?.toFixed(1) || "—"}
                        </p>
                        <div className="mt-1">{renderStars(Math.round(service.avgRating || 0))}</div>
                      </div>
                      <div className="flex-1 space-y-1">
                        {ratingDistribution().map((count, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-muted-foreground">{5 - i}</span>
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-gold rounded-full transition-all"
                                style={{ width: `${freelancerReviews.length ? (count / freelancerReviews.length) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="w-4 text-muted-foreground text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual reviews */}
                  <div className="space-y-4">
                    {freelancerReviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-border p-4 space-y-2 hover:border-primary/20 transition-colors">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-muted">
                              {review.reviewer?.full_name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{review.reviewer?.full_name || "Anonymous"}</span>
                              <span className="text-[11px] text-muted-foreground">
                                {format(new Date(review.created_at), "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="mt-0.5">{renderStars(review.rating)}</div>
                          </div>
                        </div>
                        {review.title && <p className="text-sm font-medium">{review.title}</p>}
                        {review.content && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ─── Right Column: Freelancer Profile ─── */}
            <div className="space-y-5">
              {loading ? (
                <div className="rounded-xl border border-border p-5 space-y-4 animate-pulse">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-muted" />
                    <div className="h-4 bg-muted rounded w-28" />
                    <div className="h-3 bg-muted rounded w-40" />
                  </div>
                </div>
              ) : freelancerProfile && (
                <>
                  {/* Profile card */}
                  <div className="rounded-xl border border-border p-5 space-y-4">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 border-[3px] border-gold/30 shadow-gold">
                        <AvatarImage src={freelancerProfile.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-2xl font-serif">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="mt-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-semibold text-lg">{freelancerProfile.full_name || "Anonymous"}</span>
                          {freelancerProfile.is_verified && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        {freelancerProfile.headline && (
                          <p className="text-sm text-muted-foreground mt-0.5">{freelancerProfile.headline}</p>
                        )}
                        {freelancerProfile.location && (
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {freelancerProfile.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {service.avgRating ? service.avgRating.toFixed(1) : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Rating</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{completedContracts}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Completed</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {freelancerProfile.response_time_hours
                            ? `${freelancerProfile.response_time_hours}h`
                            : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Resp. Time</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Bio */}
                    {(freelancerProfile.about || freelancerProfile.bio) && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {(freelancerProfile.about || freelancerProfile.bio)!.slice(0, 200)}
                        {((freelancerProfile.about || freelancerProfile.bio)!.length > 200) && "…"}
                      </p>
                    )}

                    <a
                      href={`/profile/${service.user_id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-gold transition-colors font-medium"
                    >
                      View Full Profile <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Skills card */}
                  {freelancerSkills.length > 0 && (
                    <div className="rounded-xl border border-border p-5 space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4 text-gold" /> Skills
                      </h4>
                      <div className="space-y-2.5">
                        {freelancerSkills.slice(0, 6).map((skill) => (
                          <div key={skill.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="truncate">{skill.skill_name}</span>
                              {skill.endorsement_count > 0 && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                                  <ThumbsUp className="w-3 h-3" /> {skill.endorsement_count}
                                </span>
                              )}
                            </div>
                            <Progress value={(skill.proficiency_level || 3) * 20} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact sticky card */}
                  {showContact && onContact && (
                    <div className="rounded-xl border border-gold/30 bg-gold/5 p-5 space-y-3">
                      <p className="text-sm font-medium text-center">Interested in this service?</p>
                      <Button variant="gold" className="w-full gap-2" onClick={onContact}>
                        <MessageCircle className="w-4 h-4" />
                        {contactLabel}
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Average response time: {freelancerProfile.response_time_hours ? `${freelancerProfile.response_time_hours} hours` : "N/A"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailDialog;
