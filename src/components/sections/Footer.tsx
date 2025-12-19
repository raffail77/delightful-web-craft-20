import { Clock, Mail, MapPin, Phone } from "lucide-react";

const footerLinks = {
  platform: [
    { name: "How It Works", href: "#how-it-works" },
    { name: "Features", href: "#features" },
    { name: "Services", href: "#services" },
    { name: "Pricing", href: "#" },
  ],
  company: [
    { name: "About Us", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
    { name: "Blog", href: "#" },
  ],
  support: [
    { name: "Help Center", href: "#" },
    { name: "Contact Us", href: "#" },
    { name: "Community", href: "#" },
    { name: "Status", href: "#" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                <Clock className="w-5 h-5 text-navy" />
              </div>
              <span className="text-2xl font-serif font-bold">
                Time<span className="text-gold">Bank</span>
              </span>
            </a>
            <p className="text-primary-foreground/70 mb-6 leading-relaxed">
              The premier platform for skill and time exchange. 
              Empowering local businesses and freelancers to grow without cash constraints.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <Mail className="w-5 h-5 text-gold" />
                <span>hello@timebank.com</span>
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <Phone className="w-5 h-5 text-gold" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <MapPin className="w-5 h-5 text-gold" />
                <span>Lahore, Pakistan</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold mb-4 text-gold">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-gold transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gold">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-gold transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gold">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-gold transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gold">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-gold transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 TimeBank. All rights reserved. Made with ♥ in Lahore.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-primary-foreground/60 hover:text-gold transition-colors text-sm">
              Twitter
            </a>
            <a href="#" className="text-primary-foreground/60 hover:text-gold transition-colors text-sm">
              LinkedIn
            </a>
            <a href="#" className="text-primary-foreground/60 hover:text-gold transition-colors text-sm">
              Facebook
            </a>
            <a href="#" className="text-primary-foreground/60 hover:text-gold transition-colors text-sm">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
