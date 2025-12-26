import { Activity, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const services = [
  { name: "Web Application", status: "operational", uptime: "99.99%" },
  { name: "API", status: "operational", uptime: "99.95%" },
  { name: "Database", status: "operational", uptime: "99.99%" },
  { name: "Authentication", status: "operational", uptime: "99.98%" },
  { name: "Messaging", status: "operational", uptime: "99.97%" },
  { name: "Notifications", status: "operational", uptime: "99.94%" },
];

const incidents = [
  {
    date: "Dec 20, 2024",
    title: "Scheduled Maintenance",
    description: "Planned maintenance completed successfully with no service interruption.",
    status: "resolved",
  },
  {
    date: "Dec 15, 2024",
    title: "Minor API Latency",
    description: "Increased API response times detected and resolved within 30 minutes.",
    status: "resolved",
  },
];

const Status = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              System <span className="text-gold">Status</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">All Systems Operational</span>
            </div>
          </div>

          {/* Service Status */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-serif font-bold mb-6">Services</h2>
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{service.uptime} uptime</span>
                    <span className="text-green-600 capitalize">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uptime Chart Placeholder */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-serif font-bold mb-6">90-Day Uptime</h2>
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gold" />
                  <span className="font-medium">Overall Uptime</span>
                </div>
                <span className="text-2xl font-bold text-green-600">99.97%</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 90 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-8 rounded-sm bg-green-500"
                    title={`Day ${90 - i}: 100%`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-serif font-bold mb-6">Recent Incidents</h2>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <Card key={incident.title}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {incident.date}
                      </CardDescription>
                      <span className="text-sm text-green-600 capitalize">{incident.status}</span>
                    </div>
                    <CardTitle className="text-lg">{incident.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{incident.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Status;
