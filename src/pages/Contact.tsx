import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const contactInfo = [
  { icon: Mail, label: "Email", value: "hello@timebank.com" },
  { icon: Phone, label: "Phone", value: "+1 (555) 123-4567" },
  { icon: MapPin, label: "Office", value: "Lahore, Pakistan" },
];

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  category: z.string().min(1),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(3000),
});

const RATE_KEY = "contact_last_sent";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", category: "general", subject: "", message: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      const last = Number(localStorage.getItem(RATE_KEY) || 0);
      if (Date.now() - last < 60_000) throw new Error("Please wait a minute before sending another message.");
      const parsed = schema.parse(form);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("contact_messages").insert({ ...parsed, user_id: userData.user?.id });
      if (error) throw error;
      localStorage.setItem(RATE_KEY, String(Date.now()));
    },
    onSuccess: () => {
      toast({ title: "Message sent", description: "We'll get back to you shortly." });
      setForm({ name: "", email: "", category: "general", subject: "", message: "" });
    },
    onError: (e: any) => toast({ title: "Could not send", description: e.message || "Please check the form", variant: "destructive" }),
  });

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
            <Card>
              <CardContent className="p-8">
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General inquiry</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="press">Press / Media</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={mutation.isPending} className="w-full bg-gold hover:bg-gold/90 text-navy">
                    <Send className="w-4 h-4 mr-2" />
                    {mutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

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
