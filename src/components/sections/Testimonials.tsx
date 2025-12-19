import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Freelance Designer",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    content: "TimeBank transformed my business. I traded design work for accounting services and saved thousands. The AI matching found me perfect clients I never would have discovered on my own.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Small Business Owner",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content: "As a startup founder, cash flow was always tight. TimeBank let me access professional services using my coding skills as currency. Game changer for any entrepreneur.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Consultant",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content: "The community here is incredible. I've built lasting professional relationships and my network has grown exponentially. The time credit system is fair and transparent.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-gradient-navy text-cream relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-semibold mb-4">
            Success Stories
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4 text-cream">
            Trusted by Thousands
          </h2>
          <p className="text-cream/70 text-lg">
            Join a community of professionals who've discovered a better way to exchange services.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-cream/5 backdrop-blur-sm rounded-3xl p-8 border border-cream/10 hover:border-gold/30 transition-all duration-300 hover:-translate-y-2 group"
            >
              {/* Quote Icon */}
              <Quote className="w-10 h-10 text-gold/50 mb-6 group-hover:text-gold transition-colors" />

              {/* Content */}
              <p className="text-cream/90 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gold/30"
                />
                <div>
                  <h4 className="font-semibold text-cream">{testimonial.name}</h4>
                  <p className="text-sm text-cream/60">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
