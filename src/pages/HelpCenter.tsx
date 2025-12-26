import { Book, CreditCard, MessageCircle, Search, Shield, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const categories = [
  { icon: User, title: "Account", description: "Profile, settings, and security" },
  { icon: CreditCard, title: "Time Credits", description: "Earning, spending, and balance" },
  { icon: MessageCircle, title: "Messaging", description: "Communication and notifications" },
  { icon: Shield, title: "Safety", description: "Trust, verification, and disputes" },
  { icon: Book, title: "Getting Started", description: "Tutorials and guides" },
];

const faqs = [
  {
    question: "How do time credits work?",
    answer: "Time credits represent hours of service. When you provide a service, you earn credits based on the hourly rate. You can then spend these credits to receive services from others.",
  },
  {
    question: "How do I start offering services?",
    answer: "Go to your profile and click 'Add Service'. Fill in the details about your skill, set your hourly credit rate, and publish. Your service will appear in the marketplace.",
  },
  {
    question: "What if there's a dispute with a service?",
    answer: "Contact us through the Help Center. We have a dispute resolution process that ensures fair outcomes for both parties.",
  },
  {
    question: "Can I convert time credits to cash?",
    answer: "Currently, time credits cannot be converted to cash. They are designed to facilitate skill exchange within our community.",
  },
  {
    question: "How is my data protected?",
    answer: "We use industry-standard encryption and security practices. Your personal information is never shared without your consent.",
  },
];

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Help <span className="text-gold">Center</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers, guides, and support for all your TimeBank questions.
            </p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
            {categories.map((cat) => (
              <Card key={cat.title} className="hover:border-gold transition-colors cursor-pointer">
                <CardHeader className="text-center">
                  <cat.icon className="w-8 h-8 mx-auto mb-2 text-gold" />
                  <CardTitle className="text-lg">{cat.title}</CardTitle>
                  <CardDescription className="text-sm">{cat.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* FAQs */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-serif font-bold text-center mb-8">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;
