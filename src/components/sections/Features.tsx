import { 
  Brain, 
  MessageSquareText, 
  Shield, 
  BarChart3, 
  Clock, 
  Users 
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Skill Matching",
    description: "Our intelligent algorithm analyzes your profile and transaction history to suggest perfect service matches.",
    gradient: "from-gold to-gold-light",
  },
  {
    icon: MessageSquareText,
    title: "24/7 Chatbot Support",
    description: "Get instant help anytime with our AI-powered assistant. Navigate the platform, ask questions, and get guidance.",
    gradient: "from-navy to-navy-light",
  },
  {
    icon: Shield,
    title: "Secure Transactions",
    description: "Every credit exchange is protected with enterprise-grade security. Your time and trust are safe with us.",
    gradient: "from-gold to-gold-light",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track your earnings, spending, and reputation. Make data-driven decisions about your service offerings.",
    gradient: "from-navy to-navy-light",
  },
  {
    icon: Clock,
    title: "Time Credit System",
    description: "Fair and transparent: 1 hour of service = 1 time credit. Simple economics that benefit everyone equally.",
    gradient: "from-gold to-gold-light",
  },
  {
    icon: Users,
    title: "Trusted Community",
    description: "Verified profiles, ratings, and reviews ensure you connect with reliable professionals every time.",
    gradient: "from-navy to-navy-light",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-navy/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-navy/10 text-navy text-sm font-semibold mb-4">
            Powerful Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
            Everything You Need to{" "}
            <span className="text-gradient-gold">Succeed</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From AI-powered matching to secure transactions, we've built the complete toolkit for modern skill exchange.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card rounded-3xl p-8 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-2 border border-border/50"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-medium`}>
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-serif font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
