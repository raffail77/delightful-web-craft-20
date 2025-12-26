import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const contactInfo = [
  { icon: Mail, label: "Email", value: "hello@timebank.com" },
  { icon: Phone, label: "Phone", value: "+1 (555) 123-4567" },
  { icon: MapPin, label: "Office", value: "Lahore, Pakistan" },
];

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Contact <span className="text-gold">Us</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <Card>
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more..."
                      rows={6}
                    />
                  </div>
                  <Button className="w-full bg-gold hover:bg-gold/90 text-navy">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-serif font-bold mb-6">Get in Touch</h2>
                <div className="space-y-4">
                  {contactInfo.map((info) => (
                    <div key={info.label} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
                      <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                        <info.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.label}</p>
                        <p className="font-medium">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-primary text-primary-foreground">
                <h3 className="text-xl font-semibold mb-3">Office Hours</h3>
                <div className="space-y-2 text-primary-foreground/80">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM (PKT)</p>
                  <p>Saturday: 10:00 AM - 2:00 PM (PKT)</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
