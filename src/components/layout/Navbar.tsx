import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { Clock, Menu, X, User, LogOut, MessageCircle, Coins, History, FileText, LayoutDashboard, Shield } from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { credits, isLoading: creditsLoading } = useCredits();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Marketplace", href: "/marketplace", isRoute: true },
    { name: "About Us", href: "/about", isRoute: true },
    { name: "Features", href: "#features", isRoute: false },
    { name: "Services", href: "#services", isRoute: false },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-soft"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-navy" />
            </div>
            <span className="text-2xl font-serif font-bold text-foreground">
              Time<span className="text-gold">Bank</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.name}
                </a>
              )
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <>
                {/* Credits Display */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full">
                  <Coins className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-gold">
                    {creditsLoading ? "..." : credits}
                  </span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center">
                        <User className="w-4 h-4 text-navy" />
                      </div>
                      <span className="max-w-[100px] truncate">
                        {user.email?.split("@")[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/messages")}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/transactions")}>
                      <History className="w-4 h-4 mr-2" />
                      Transactions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/wallet")}>
                      <Coins className="w-4 h-4 mr-2" />
                      Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/contracts")}>
                      <FileText className="w-4 h-4 mr-2" />
                      Contracts
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button variant="gold" onClick={() => navigate("/auth?mode=signup")}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-6 animate-fade-up">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                )
              )}
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                {loading ? (
                  <div className="w-full h-10 bg-muted animate-pulse rounded-md" />
                ) : user ? (
                  <>
                    {/* Mobile Credits Display */}
                    <div className="flex items-center justify-center gap-2 py-2 bg-gold/10 border border-gold/20 rounded-lg mb-2">
                      <Coins className="w-4 h-4 text-gold" />
                      <span className="font-semibold text-gold">
                        {creditsLoading ? "..." : credits} Credits
                      </span>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-secondary"
                        onClick={() => {
                          navigate("/admin");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate("/dashboard");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate("/profile");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate("/messages");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Messages
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate("/transactions");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Transactions
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate("/contracts");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Contracts
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        navigate("/auth");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="gold"
                      className="w-full"
                      onClick={() => {
                        navigate("/auth?mode=signup");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
