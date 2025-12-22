import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Clock, MapPin, Wifi, Plus, Search, Filter } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Service = Database["public"]["Tables"]["services"]["Row"];
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "offers" | "requests">("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("offer");
  const [hourlyCredits, setHourlyCredits] = useState(1);
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel("services-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        () => fetchServices()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to create a service", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("services").insert({
      user_id: user.id,
      title,
      description,
      category,
      service_type: serviceType,
      hourly_credits: hourlyCredits,
      location: location || null,
      is_remote: isRemote,
    });

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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold">Services Marketplace</h1>
              <p className="text-muted-foreground mt-1">Find skills to learn or share your expertise</p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="offer">I'm Offering</SelectItem>
                          <SelectItem value="request">I'm Requesting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
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
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Python Programming Lessons"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your service in detail..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="credits">Time Credits / Hour</Label>
                      <Input
                        id="credits"
                        type="number"
                        min={1}
                        max={10}
                        value={hourlyCredits}
                        onChange={(e) => setHourlyCredits(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location (optional)</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, State"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">Available remotely</span>
                    </div>
                    <Switch checked={isRemote} onCheckedChange={setIsRemote} />
                  </div>

                  <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting || !category}>
                    {isSubmitting ? "Posting..." : "Post Service"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "offers" | "requests")} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Services</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Services Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card p-6 rounded-xl animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-16 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No services found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or post the first one!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const ServiceCard = ({ service }: { service: Service }) => {
  return (
    <div className="glass-card p-6 rounded-xl hover:shadow-lg transition-all group">
      <div className="flex items-center justify-between mb-3">
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

      <h3 className="text-lg font-semibold mb-2 group-hover:text-gold transition-colors line-clamp-2">
        {service.title}
      </h3>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{service.description}</p>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-1 text-gold font-semibold">
          <Clock className="w-4 h-4" />
          {service.hourly_credits} credit{service.hourly_credits !== 1 ? "s" : ""}/hr
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {service.is_remote && (
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Remote
            </span>
          )}
          {service.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {service.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
