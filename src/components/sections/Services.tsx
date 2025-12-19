import { 
  Code, 
  Palette, 
  PenTool, 
  Calculator, 
  Camera, 
  Megaphone,
  Scale,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  { icon: Code, name: "Web Development", count: "1,240+ providers" },
  { icon: Palette, name: "Graphic Design", count: "890+ providers" },
  { icon: PenTool, name: "Content Writing", count: "1,100+ providers" },
  { icon: Calculator, name: "Accounting", count: "560+ providers" },
  { icon: Camera, name: "Photography", count: "720+ providers" },
  { icon: Megaphone, name: "Digital Marketing", count: "980+ providers" },
  { icon: Scale, name: "Legal Consulting", count: "340+ providers" },
  { icon: BookOpen, name: "Translation", count: "650+ providers" },
];

const Services = () => {
  return (
    <section id="services" className="py-24 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-semibold mb-4">
              200+ Categories
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-6">
              Find Any Service You Need
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              From web development to legal consulting, our diverse community offers professional 
              services across every industry. Trade your expertise for the skills you need.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="gold" size="lg" className="group">
                Explore All Services
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                Offer Your Service
              </Button>
            </div>
          </div>

          {/* Right - Services Grid */}
          <div className="grid grid-cols-2 gap-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="group glass-card p-5 hover-lift cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <service.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-gold transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{service.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
