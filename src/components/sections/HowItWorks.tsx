import { UserPlus, ListPlus, Repeat, Star } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up and showcase your professional skills. Tell the community what services you can offer.",
    color: "bg-gold/10 text-gold",
  },
  {
    icon: ListPlus,
    title: "List Your Services",
    description: "Add your services with descriptions and time estimates. Set your availability and expertise level.",
    color: "bg-navy/10 text-navy",
  },
  {
    icon: Repeat,
    title: "Exchange & Earn",
    description: "Provide services to earn time credits. Use your credits to get services from other skilled members.",
    color: "bg-gold/10 text-gold",
  },
  {
    icon: Star,
    title: "Build Reputation",
    description: "Receive ratings and reviews. Build trust and unlock more opportunities within the community.",
    color: "bg-navy/10 text-navy",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-semibold mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
            How TimeBank Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Start trading your skills in four simple steps. No money required, just your valuable time and expertise.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(100%+0.5rem)] w-[calc(100%-1rem)] h-0.5 bg-border">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold" />
                </div>
              )}

              <div className="glass-card p-6 h-full hover-lift">
                {/* Step Number */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-gold text-navy font-bold text-sm flex items-center justify-center shadow-gold">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-serif font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
