import { Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const openings = [
  {
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "Lahore, Pakistan",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Community Manager",
    department: "Operations",
    location: "Lahore, Pakistan",
    type: "Full-time",
  },
  {
    title: "Marketing Specialist",
    department: "Marketing",
    location: "Remote",
    type: "Part-time",
  },
];

const benefits = [
  "Flexible working hours",
  "Remote-first culture",
  "Health insurance",
  "Learning & development budget",
  "Time credits bonus",
  "Team retreats",
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Join Our <span className="text-gold">Team</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Help us build the future of skill and time exchange. We're looking for passionate 
              individuals who want to make a difference.
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-16 p-8 rounded-2xl bg-primary text-primary-foreground">
            <h2 className="text-2xl font-serif font-bold mb-6 text-center">Why Work With Us?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Openings */}
          <div>
            <h2 className="text-3xl font-serif font-bold text-center mb-8">Open Positions</h2>
            <div className="grid gap-4 max-w-3xl mx-auto">
              {openings.map((job) => (
                <Card key={job.title} className="hover:border-gold transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{job.type}</Badge>
                      <Button className="bg-gold hover:bg-gold/90 text-navy">Apply</Button>
                    </div>
                  </CardHeader>
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

export default Careers;
