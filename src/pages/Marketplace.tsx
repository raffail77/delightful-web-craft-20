import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  MapPin,
  Wifi,
  Plus,
  Search,
  Filter,
  User,
  MessageCircle,
  Trash2,
  Star,
  ArrowRight,
  ImagePlus,
  X,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import MessagingDialog from "@/components/MessagingDialog";

type ServiceProfile = {
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
};

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: ServiceProfile | null;
  avgRating?: number;
  reviewCount?: number;
};
type ServiceType = Database["public"]["Enums"]["service_type"];

const CATEGORIES = [
  "Technology",
  "Design",
  "Writing",
  "Marketing",
  "Teaching",
  "Music",
  "Fitness",
  "Cooking",
  "Languages",
  "Crafts",
  "Gardening",
  "Home Repair",
  "Other",
];

const Marketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "offers" | "requests">("all");

  // Messaging state
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [messagingReceiver, setMessagingReceiver] = useState({ id: "", name: "" });
  const [messagingService, setMessagingService] = useState<{ id: string; title: string; serviceType?: "offer" | "request"; serviceOwnerId?: string }>({ id: "", title: "" });

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("offer");
  const [hourlyCredits, setHourlyCredits] = useState(1);
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleContactProvider = (
    receiverId: string,
    receiverName: string,
    serviceId: string,
    serviceTitle: string,
    svcType: "offer" | "request",
    serviceOwnerId: string
  ) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to contact this user" });
      navigate("/auth");
      return;
    }
    setMessagingReceiver({ id: receiverId, name: receiverName });
    setMessagingService({ id: serviceId, title: serviceTitle, serviceType: svcType, serviceOwnerId });
    setMessagingOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    const { error } = await supabase.from("services").delete().eq("id", serviceId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Service has been removed" });
    }
  };

  useEffect(() => {
    fetchServices();
    const channel = supabase
      .channel("services-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => fetchServices())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchServices = async () => {
    const { data: servicesData, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(servicesData?.map((s) => s.user_id) || [])];

    // Fetch profiles with avatar + headline, and reviews for ratings
    const [{ data: profilesData }, { data: reviewsData }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url, headline").in("user_id", userIds),
      supabase.from("reviews").select("reviewee_id, rating"),
    ]);

    const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);

    // Build rating map per user
    const ratingMap = new Map<string, { sum: number; count: number }>();
    reviewsData?.forEach((r: any) => {
      const existing = ratingMap.get(r.reviewee_id) || { sum: 0, count: 0 };
      existing.sum += r.rating;
      existing.count += 1;
      ratingMap.set(r.reviewee_id, existing);
    });

    const servicesWithProfiles =
      servicesData?.map((service) => {
        const rating = ratingMap.get(service.user_id);
        return {
          ...service,
          profiles: profilesMap.get(service.user_id) || null,
          avgRating: rating ? rating.sum / rating.count : 0,
          reviewCount: rating?.count || 0,
        };
      }) || [];

    setServices(servicesWithProfiles);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to create a service", variant: "destructive" });
      return;
    }

    // Client-side validation
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 120) {
      toast({ title: "Invalid title", description: "Title must be 3-120 characters", variant: "destructive" });
      return;
    }
    if (trimmedDesc.length < 10 || trimmedDesc.length > 2000) {
      toast({ title: "Invalid description", description: "Description must be 10-2000 characters", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Category required", description: "Please select a category", variant: "destructive" });
      return;
    }
    if (hourlyCredits < 1 || hourlyCredits > 100 || !Number.isInteger(hourlyCredits)) {
      toast({ title: "Invalid credits", description: "Credits must be 1-100", variant: "destructive" });
      return;
    }

    // Validate image file type if present
    if (imageFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(imageFile.type)) {
        toast({ title: "Invalid image", description: "Only JPEG, PNG, WebP, and GIF images are allowed", variant: "destructive" });
        return;
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        toast({ title: "Image too large", description: "Maximum file size is 5MB", variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);

    let imageUrl: string | null = null;

    // Upload image if selected
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("service-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        toast({ title: "Image upload failed", description: uploadError.message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("service-images")
        .getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("services").insert({
      user_id: user.id,
      title,
      description,
      category,
      service_type: serviceType,
      hourly_credits: hourlyCredits,
      location: location || null,
      is_remote: isRemote,
      image_url: imageUrl,
    } as any);
    setIsSubmitting(false);
    if (error) {
      toast({ title: "Error", description: "Failed to create service", variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Your service has been posted" });
      setDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setServiceType("offer");
    setHourlyCredits(1);
    setLocation("");
    setIsRemote(true);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    const matchesType =
      activeTab === "all" ||
      (activeTab === "offers" && service.service_type === "offer") ||
      (activeTab === "requests" && service.service_type === "request");
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero-style Header */}
          <div className="rounded-2xl bg-gradient-navy p-8 md:p-12 mb-8 text-primary-foreground">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
              Find the perfect <span className="text-gradient-gold">freelance</span> services
            </h1>
            <p className="text-primary-foreground/70 mb-6 max-w-xl">
              Discover skilled professionals ready to bring your projects to life. Trade expertise with time credits.
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background text-foreground h-12"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background text-foreground h-12">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All Services</TabsTrigger>
                <TabsTrigger value="offers">Offers</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              if (open && !user) {
                toast({ title: "Sign in required", description: "Please sign in to post a service" });
                navigate("/auth");
                return;
              }
              setDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Post a Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-serif">Post a New Service</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Service Type</Label>
                      <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="offer">I'm Offering</SelectItem>
                          <SelectItem value="request">I'm Requesting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Python Programming Lessons" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your service in detail..." rows={4} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="credits">Time Credits / Hour</Label>
                      <Input id="credits" type="number" min={1} max={10} value={hourlyCredits} onChange={(e) => setHourlyCredits(parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location (optional)</Label>
                      <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">Available remotely</span>
                    </div>
                    <Switch checked={isRemote} onCheckedChange={setIsRemote} />
                   </div>
                  {/* Image upload */}
                  <div className="space-y-2">
                    <Label>Cover Image (optional)</Label>
                    {imagePreview ? (
                      <div className="relative rounded-lg overflow-hidden h-32">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-7 w-7 bg-background/80 hover:bg-background"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                        <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Click to upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                  <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting || !category}>
                    {isSubmitting ? "Posting..." : "Post Service"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer px-4 py-1.5 text-sm"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Badge>
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer px-4 py-1.5 text-sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Services Grid - Fiverr-style cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border overflow-hidden animate-pulse">
                  <div className="h-40 bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="h-3 bg-muted rounded w-24" />
                    </div>
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No services found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or post the first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  currentUserId={user?.id}
                  onContact={handleContactProvider}
                  onDelete={handleDeleteService}
                />
              ))}
            </div>
          )}
        </div>
      </main>


      <MessagingDialog
        open={messagingOpen}
        onOpenChange={setMessagingOpen}
        receiverId={messagingReceiver.id}
        receiverName={messagingReceiver.name}
        serviceId={messagingService.id}
        serviceTitle={messagingService.title}
        serviceType={messagingService.serviceType}
        serviceOwnerId={messagingService.serviceOwnerId}
      />

      <Footer />
    </div>
  );
};

/* ───────── Fiverr-style Service Card ───────── */

const ServiceCard = ({
  service,
  currentUserId,
  onContact,
  onDelete,
}: {
  service: Service;
  currentUserId?: string;
  onContact: (receiverId: string, receiverName: string, serviceId: string, serviceTitle: string, serviceType: "offer" | "request", serviceOwnerId: string) => void;
  onDelete: (serviceId: string) => void;
}) => {
  const navigate = useNavigate();
  const isOwner = currentUserId === service.user_id;
  const showContactButton = currentUserId && !isOwner;
  const contactLabel = service.service_type === "offer" ? "Contact Provider" : "Contact Receiver";
  const initials = service.profiles?.full_name
    ? service.profiles.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div
      className="group rounded-xl border border-border bg-card overflow-hidden hover-lift cursor-pointer"
      onClick={() => navigate(`/service/${service.id}`)}
    >
      {/* Color header strip / image */}
      <div className="relative h-36 bg-gradient-navy flex items-end p-4">
        {(service as any).image_url && (
          <img
            src={(service as any).image_url}
            alt={service.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge
          className={`absolute top-3 left-3 z-10 text-xs ${
            service.service_type === "offer"
              ? "bg-emerald-500/90 text-white hover:bg-emerald-500"
              : "bg-sky-500/90 text-white hover:bg-sky-500"
          }`}
        >
          {service.service_type === "offer" ? "Offering" : "Requesting"}
        </Badge>

        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-7 w-7 z-10 text-white/70 hover:text-destructive hover:bg-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Service</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{service.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(service.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <h3 className="relative z-10 text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow-md">
          {service.title}
        </h3>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-3">
        {/* Freelancer row */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={service.profiles?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{service.profiles?.full_name || "Anonymous"}</p>
            {service.profiles?.headline && (
              <p className="text-xs text-muted-foreground truncate">{service.profiles.headline}</p>
            )}
          </div>
        </div>

        {/* Rating + Category */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            <span className="text-sm font-semibold">
              {service.avgRating ? service.avgRating.toFixed(1) : "New"}
            </span>
            {(service.reviewCount ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground">({service.reviewCount})</span>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">{service.category}</Badge>
        </div>

        {/* Meta: credits + location */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            {service.is_remote && (
              <span className="flex items-center gap-0.5">
                <Wifi className="w-3 h-3" /> Remote
              </span>
            )}
            {service.location && (
              <span className="flex items-center gap-0.5 ml-2">
                <MapPin className="w-3 h-3" /> {service.location}
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-gold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {service.hourly_credits} cr/hr
          </span>
        </div>

        {showContactButton && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 mt-1"
            onClick={(e) => {
              e.stopPropagation();
              onContact(service.user_id, service.profiles?.full_name || "User", service.id, service.title, service.service_type, service.user_id);
            }}
          >
            <MessageCircle className="w-4 h-4" />
            {contactLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
