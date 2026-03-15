import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import MessagingDialog from "@/components/MessagingDialog";
import ContractProposalDialog from "@/components/messaging/ContractProposalDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Clock,
  MapPin,
  Wifi,
  MessageCircle,
  Star,
  Award,
  Shield,
  CheckCircle2,
  Zap,
  Globe,
  ThumbsUp,
  ArrowLeft,
  Calendar,
  Package,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];

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
  created_at: string;
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

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [service, setService] = useState<ServiceRow | null>(null);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [skills, setSkills] = useState<FreelancerSkill[]>([]);
  const [reviews, setReviews] = useState<FreelancerReview[]>([]);
  const [relatedServices, setRelatedServices] = useState<(ServiceRow & { profiles?: { full_name: string | null; avatar_url: string | null } | null; avgRating?: number; reviewCount?: number })[]>([]);
  const [completedContracts, setCompletedContracts] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Messaging
  const [messagingOpen, setMessagingOpen] = useState(false);

  useEffect(() => {
    if (id) fetchAll(id);
  }, [id]);

  const fetchAll = async (serviceId: string) => {
    setLoading(true);

    // 1. Fetch service
    const { data: svc, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .maybeSingle();

    if (error || !svc) {
      setLoading(false);
      return;
    }
    setService(svc);

    // 2. Parallel fetches
    const [
      { data: profileData },
      { data: skillsData },
      { data: reviewsData },
      { count: contractsCount },
      { data: ratingsData },
      { data: related },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url, headline, bio, about, location, availability_status, skills, is_verified, response_time_hours, created_at")
        .eq("user_id", svc.user_id)
        .maybeSingle(),
      supabase
        .from("user_skills")
        .select("id, skill_name, proficiency_level, endorsement_count")
        .eq("user_id", svc.user_id)
        .order("endorsement_count", { ascending: false })
        .limit(10),
      supabase
        .from("reviews")
        .select("id, rating, title, content, created_at, reviewer_id")
        .eq("reviewee_id", svc.user_id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .or(`client_id.eq.${svc.user_id},provider_id.eq.${svc.user_id}`)
        .eq("status", "completed"),
      supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", svc.user_id),
      supabase
        .from("services")
        .select("*")
        .eq("user_id", svc.user_id)
        .neq("id", serviceId)
        .eq("is_active", true)
        .limit(4),
    ]);

    setProfile(profileData as FreelancerProfile | null);
    setSkills((skillsData as FreelancerSkill[]) || []);
    setCompletedContracts(contractsCount || 0);

    // Ratings
    if (ratingsData && ratingsData.length > 0) {
      const sum = ratingsData.reduce((a: number, r: any) => a + r.rating, 0);
      setAvgRating(sum / ratingsData.length);
      setReviewCount(ratingsData.length);
    }

    // Enrich reviews with reviewer profiles
    if (reviewsData && reviewsData.length > 0) {
      const reviewerIds = reviewsData.map((r: any) => r.reviewer_id);
      const { data: reviewerProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", reviewerIds);

      const enriched = reviewsData.map((r: any) => ({
        ...r,
        reviewer: reviewerProfiles?.find((p: any) => p.user_id === r.reviewer_id) || null,
      }));
      setReviews(enriched);
    } else {
      setReviews([]);
    }

    // Related services with profiles
    if (related && related.length > 0) {
      const { data: relProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("user_id", svc.user_id);
      const p = relProfiles?.[0] || null;
      setRelatedServices(related.map((s) => ({ ...s, profiles: p })));
    } else {
      setRelatedServices([]);
    }

    setLoading(false);
  };

  const handleContact = () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to contact this user" });
      navigate("/auth");
      return;
    }
    setMessagingOpen(true);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? "text-gold fill-gold" : "text-muted-foreground/20"}`} />
      ))}
    </div>
  );

  const ratingDistribution = () => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    });
    return dist.reverse();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-72 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-40 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 text-center">
          <h1 className="text-2xl font-serif font-bold mb-2">Service Not Found</h1>
          <p className="text-muted-foreground mb-6">This service may have been removed or doesn't exist.</p>
          <Button variant="gold" onClick={() => navigate("/marketplace")}>Back to Marketplace</Button>
        </main>
      </div>
    );
  }

  const isOwner = user?.id === service.user_id;
  const showContact = user && !isOwner;
  const contactLabel = service.service_type === "offer" ? "Order This Service" : "Offer Your Service";
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";
  const usdPrice = (service.hourly_credits * 2).toFixed(0);

  const faqs = [
    { q: "How does credit-based payment work?", a: "Each credit equals approximately 30 minutes of service. You can purchase credits or earn them by offering your own services." },
    { q: "What happens after I order?", a: "A contract is created between you and the freelancer. Credits are held in escrow until both parties confirm the work is complete." },
    { q: "Can I get a refund?", a: "If there's a dispute, both parties can raise it through the contract system. Our platform mediates to ensure fair outcomes." },
    { q: "Is this service available remotely?", a: service.is_remote ? "Yes, this service is available for remote delivery." : `This service is offered on-site${service.location ? ` in ${service.location}` : ""}.` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 max-w-6xl mb-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/marketplace" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Marketplace
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate max-w-[300px]">{service.title}</span>
          </nav>
        </div>

        <div className="container mx-auto px-4 max-w-6xl">
          {/* ── Service Header ── */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className={`text-xs font-medium ${service.service_type === "offer" ? "bg-emerald-500/90 text-white hover:bg-emerald-500" : "bg-sky-500/90 text-white hover:bg-sky-500"}`}>
                {service.service_type === "offer" ? "✦ Offering" : "✦ Requesting"}
              </Badge>
              <Badge variant="outline" className="text-xs">{service.category}</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold mb-3">{service.title}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                </Avatar>
                <Link to={`/profile/${service.user_id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                  {profile?.full_name || "Anonymous"}
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="font-semibold text-foreground">{avgRating ? avgRating.toFixed(1) : "New"}</span>
                {reviewCount > 0 && <span>({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>}
              </div>
              {completedContracts > 0 && (
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> {completedContracts} orders completed
                </span>
              )}
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ─ Left Column ─ */}
            <div className="lg:col-span-2 space-y-8">

              {/* Gallery / Image */}
              <div className="rounded-2xl overflow-hidden border border-border bg-muted/30">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.title}
                    className="w-full h-64 md:h-80 lg:h-96 object-cover"
                  />
                ) : (
                  <div className="h-64 md:h-80 lg:h-96 bg-gradient-navy flex items-center justify-center">
                    <div className="text-center text-primary-foreground/60">
                      <Package className="w-16 h-16 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No image provided</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Description */}
              <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold">About This Service</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {service.description}
                </p>
              </section>

              {/* What's Included */}
              <section className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">What's Included</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Clock, label: `${service.hourly_credits} credit${service.hourly_credits !== 1 ? "s" : ""} per hour` },
                    { icon: service.is_remote ? Wifi : MapPin, label: service.is_remote ? "Remote delivery available" : (service.location || "On-site service") },
                    { icon: Zap, label: "Quick response time" },
                    { icon: Shield, label: "Secure escrow payment" },
                    { icon: CheckCircle2, label: "Mutual completion confirmation" },
                    { icon: CreditCard, label: "Pay with credits or USD" },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <feat.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span>{feat.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Reviews Section */}
              <section className="space-y-6">
                <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold fill-gold" />
                  Reviews
                  {reviewCount > 0 && <span className="text-sm font-normal text-muted-foreground">({reviewCount})</span>}
                </h2>

                {reviews.length > 0 ? (
                  <>
                    {/* Rating breakdown */}
                    {reviews.length >= 2 && (
                      <div className="flex items-center gap-6 p-5 rounded-xl border border-border bg-muted/20">
                        <div className="text-center min-w-[80px]">
                          <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
                          <div className="mt-1">{renderStars(avgRating)}</div>
                          <p className="text-xs text-muted-foreground mt-1">{reviewCount} reviews</p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {ratingDistribution().map((count, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="w-3 text-muted-foreground">{5 - i}</span>
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-gold rounded-full transition-all"
                                  style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
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
                      {reviews.map((review) => (
                        <div key={review.id} className="rounded-xl border border-border p-5 space-y-2 hover:border-primary/20 transition-colors">
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
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(review.created_at), "MMM d, yyyy")}
                                </span>
                              </div>
                              <div className="mt-0.5">{renderStars(review.rating)}</div>
                            </div>
                          </div>
                          {review.title && <p className="text-sm font-medium">{review.title}</p>}
                          {review.content && <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 rounded-xl border border-border bg-muted/10">
                    <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No reviews yet. Be the first to work with this freelancer!</p>
                  </div>
                )}
              </section>

              {/* FAQs */}
              <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            </div>

            {/* ─ Right Column (Sticky) ─ */}
            <div className="space-y-6">
              {/* Pricing / Order Panel */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-5 lg:sticky lg:top-28">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Service Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gold">{service.hourly_credits}</span>
                    <span className="text-sm text-muted-foreground">credits/hr</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">≈ ${usdPrice} USD / hour</p>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Delivery
                    </span>
                    <span className="font-medium">Varies by project</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Availability
                    </span>
                    <span className="font-medium">{service.is_remote ? "Remote" : "On-site"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Payment
                    </span>
                    <span className="font-medium">Escrow protected</span>
                  </div>
                </div>

                <Separator />

                {showContact ? (
                  <Button variant="gold" className="w-full gap-2 text-base h-12" onClick={handleContact}>
                    <MessageCircle className="w-5 h-5" />
                    {contactLabel}
                  </Button>
                ) : !user ? (
                  <Button variant="gold" className="w-full gap-2 text-base h-12" onClick={() => navigate("/auth")}>
                    Sign In to Order
                  </Button>
                ) : isOwner ? (
                  <p className="text-sm text-center text-muted-foreground">This is your service listing.</p>
                ) : null}
              </div>

              {/* Freelancer Profile Card */}
              {profile && (
                <div className="rounded-xl border border-border p-6 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">About the Freelancer</h3>
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 border-[3px] border-gold/30 shadow-gold">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-2xl font-serif">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="mt-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-semibold text-lg">{profile.full_name || "Anonymous"}</span>
                        {profile.is_verified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      {profile.headline && <p className="text-sm text-muted-foreground mt-0.5">{profile.headline}</p>}
                      {profile.location && (
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {profile.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{avgRating ? avgRating.toFixed(1) : "—"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Rating</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{completedContracts}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Completed</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {profile.response_time_hours ? `${profile.response_time_hours}h` : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">Response</p>
                    </div>
                  </div>

                  <Separator />

                  {(profile.about || profile.bio) && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {(profile.about || profile.bio)!.slice(0, 200)}
                      {(profile.about || profile.bio)!.length > 200 && "…"}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Member since {format(new Date(profile.created_at), "MMM yyyy")}
                  </div>

                  <Link to={`/profile/${service.user_id}`}>
                    <Button variant="outline" className="w-full text-sm">View Full Profile</Button>
                  </Link>
                </div>
              )}

              {/* Skills Card */}
              {skills.length > 0 && (
                <div className="rounded-xl border border-border p-6 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-gold" /> Skills
                  </h4>
                  <div className="space-y-2.5">
                    {skills.slice(0, 8).map((skill) => (
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
            </div>
          </div>

          {/* ── Related Services ── */}
          {relatedServices.length > 0 && (
            <section className="mt-16 space-y-6">
              <h2 className="text-xl font-serif font-semibold">More from {profile?.full_name || "this freelancer"}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {relatedServices.map((svc) => (
                  <Link
                    key={svc.id}
                    to={`/service/${svc.id}`}
                    className="group rounded-xl border border-border bg-card overflow-hidden hover-lift"
                  >
                    <div className="relative h-32 bg-gradient-navy flex items-end p-3">
                      {svc.image_url && (
                        <img src={svc.image_url} alt={svc.title} className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className={`absolute top-2 left-2 z-10 text-[10px] ${svc.service_type === "offer" ? "bg-emerald-500/90 text-white" : "bg-sky-500/90 text-white"}`}>
                        {svc.service_type === "offer" ? "Offering" : "Requesting"}
                      </Badge>
                      <h3 className="relative z-10 text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow-md">
                        {svc.title}
                      </h3>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{svc.category}</Badge>
                      <span className="text-sm font-bold text-gold">{svc.hourly_credits} cr/hr</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Messaging Dialog */}
      {service && (
        <MessagingDialog
          open={messagingOpen}
          onOpenChange={setMessagingOpen}
          receiverId={service.user_id}
          receiverName={profile?.full_name || "User"}
          serviceId={service.id}
          serviceTitle={service.title}
          serviceType={service.service_type as "offer" | "request"}
          serviceOwnerId={service.user_id}
        />
      )}

      <Footer />
    </div>
  );
};

export default ServiceDetail;
