import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const pressReleases = [
  {
    date: "December 2024",
    title: "TimeBank Launches New Business Tier",
    description: "Introducing team management and API access for organizations.",
  },
  {
    date: "October 2024",
    title: "TimeBank Reaches 50,000 Users",
    description: "Milestone achievement as platform grows across Pakistan.",
  },
  {
    date: "August 2024",
    title: "TimeBank Secures Seed Funding",
    description: "Local VC backs time exchange platform with significant investment.",
  },
];

const mediaFeatures = [
  { outlet: "Dawn", title: "The Rise of Time Banking in Pakistan" },
  { outlet: "Express Tribune", title: "How Startups Are Reimagining Commerce" },
  { outlet: "TechJuice", title: "TimeBank: A New Way to Exchange Skills" },
];

const Press = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Press & <span className="text-gold">Media</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Latest news, press releases, and media resources about TimeBank.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Press Releases */}
            <div>
              <h2 className="text-2xl font-serif font-bold mb-6">Press Releases</h2>
              <div className="space-y-4">
                {pressReleases.map((release) => (
                  <Card key={release.title}>
                    <CardHeader>
                      <CardDescription>{release.date}</CardDescription>
                      <CardTitle className="text-lg">{release.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{release.description}</p>
                      <Button variant="link" className="p-0 text-gold">
                        Read More <ExternalLink className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Media Kit & Features */}
            <div className="space-y-8">
              <div className="p-8 rounded-2xl bg-card border border-border">
                <h2 className="text-2xl font-serif font-bold mb-4">Media Kit</h2>
                <p className="text-muted-foreground mb-6">
                  Download our brand assets, logos, and company information.
                </p>
                <Button className="bg-gold hover:bg-gold/90 text-navy">
                  <Download className="w-4 h-4 mr-2" />
                  Download Media Kit
                </Button>
              </div>

              <div>
                <h2 className="text-2xl font-serif font-bold mb-6">Featured In</h2>
                <div className="space-y-3">
                  {mediaFeatures.map((feature) => (
                    <div
                      key={feature.title}
                      className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
                    >
                      <div>
                        <span className="font-semibold text-gold">{feature.outlet}</span>
                        <p className="text-muted-foreground text-sm">{feature.title}</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center p-8 rounded-2xl bg-muted">
            <h3 className="text-xl font-semibold mb-2">Media Inquiries</h3>
            <p className="text-muted-foreground mb-4">
              For press inquiries, please contact our communications team.
            </p>
            <a href="mailto:press@timebank.com" className="text-gold hover:underline">
              press@timebank.com
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Press;
