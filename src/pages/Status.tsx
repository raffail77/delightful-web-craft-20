import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import { supabase } from "@/integrations/supabase/client";

const statusColor = (s: string) =>
  s === "operational" ? "bg-green-500"
  : s === "degraded" ? "bg-yellow-500"
  : s === "partial_outage" ? "bg-orange-500"
  : "bg-red-500";

const statusLabel = (s: string) => s.replace(/_/g, " ");

const Status = () => {
  const { data: services = [], isLoading: lsv } = useQuery({
    queryKey: ["service-status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_status").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: incidents = [], isLoading: linc } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const allOperational = services.every((s: any) => s.status === "operational");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              System <span className="text-gold">Status</span>
            </h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              allOperational ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
            }`}>
              {allOperational ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">
                {allOperational ? "All Systems Operational" : "Some Systems Affected"}
              </span>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-serif font-bold mb-6">Services</h2>
            {lsv ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : (
              <div className="space-y-3">
                {services.map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${statusColor(service.status)}`} />
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{Number(service.uptime_percentage).toFixed(2)}% uptime</span>
                      <span className="capitalize">{statusLabel(service.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-serif font-bold mb-6">Recent Incidents</h2>
            {linc ? (
              <Skeleton className="h-32" />
            ) : incidents.length === 0 ? (
              <p className="text-muted-foreground">No recent incidents reported.</p>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident: any) => (
                  <Card key={incident.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardDescription className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(incident.started_at).toLocaleDateString()}
                        </CardDescription>
                        <span className={`text-sm capitalize ${
                          incident.status === "resolved" ? "text-green-600" : "text-yellow-600"
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{incident.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Status;
