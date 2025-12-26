import { Clock, Heart, Users, Zap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const values = [
  {
    icon: Heart,
    title: "Community First",
    description: "We believe in the power of local communities helping each other grow and thrive.",
  },
  {
    icon: Users,
    title: "Equal Exchange",
    description: "Every hour of work has equal value, regardless of the type of skill or service.",
  },
  {
    icon: Zap,
    title: "Empowerment",
    description: "We enable people to access services and grow businesses without cash constraints.",
  },
  {
    icon: Clock,
    title: "Time as Currency",
    description: "Your time is valuable. We help you leverage it to get what you need.",
  },
];

const team = [
  { name: "Sarah Ahmed", role: "CEO & Founder", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
  { name: "Ali Hassan", role: "CTO", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
  { name: "Fatima Khan", role: "Head of Community", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200" },
  { name: "Omar Malik", role: "Lead Developer", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              About <span className="text-gold">TimeBank</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              TimeBank was founded in Lahore with a simple mission: to create a platform where skills and time 
              can be exchanged freely, empowering local businesses and individuals to grow without traditional 
              financial barriers.
            </p>
          </div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value) => (
                <div key={value.title} className="text-center p-6 rounded-2xl bg-card border border-border">
                  <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <h2 className="text-3xl font-serif font-bold text-center mb-12">Our Team</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {team.map((member) => (
                <div key={member.name} className="text-center">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-muted-foreground text-sm">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
