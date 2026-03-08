import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, Star, Crown, Rocket, Check, Sparkles } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
  sort_order: number;
}

const PACKAGE_ICONS: Record<string, React.ElementType> = {
  Starter: Coins,
  Basic: Zap,
  Popular: Star,
  Pro: Crown,
  Enterprise: Rocket,
};

export default function BuyCredits() {
  const { user, loading: authLoading } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loadingPkg, setLoadingPkg] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    supabase
      .from("credit_packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setPackages((data as any[]) || []);
        setLoadingPkg(false);
      });
  }, []);

  const handlePurchase = async (pkgId: string) => {
    setPurchasing(pkgId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { package_id: pkgId },
      });
      if (error) throw error;
      if (data?.url) {
        // Use top-level navigation to escape iframe, fallback to new tab
        try {
          if (window.top && window.top !== window) {
            window.top.location.href = data.url;
          } else {
            window.location.href = data.url;
          }
        } catch {
          window.open(data.url, "_blank");
        }
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not start checkout", variant: "destructive" });
    } finally {
      setPurchasing(null);
    }
  };

  const searchParams = new URLSearchParams(window.location.search);
  const paymentCancelled = searchParams.get("payment") === "cancelled";

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary-foreground px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">Credit Packages</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-3">
              Buy Credits
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Each credit represents ~30 minutes of service time (~$2 value).
              Purchase packages below to fund your wallet.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Current balance: <span className="font-semibold text-foreground">{credits} credits</span>
            </div>
          </div>

          {paymentCancelled && (
            <div className="mb-8 p-4 bg-destructive/10 text-destructive rounded-lg text-center text-sm">
              Payment was cancelled. You can try again anytime.
            </div>
          )}

          {/* Packages grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const Icon = PACKAGE_ICONS[pkg.name] || Coins;
              const perCredit = (Number(pkg.price_usd) / pkg.credits).toFixed(2);
              const isPopular = pkg.name === "Popular";
              const savings = Math.round((1 - Number(pkg.price_usd) / (pkg.credits * 2)) * 100);

              return (
                <Card
                  key={pkg.id}
                  className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    isPopular
                      ? "border-secondary shadow-[var(--shadow-gold)] scale-[1.02]"
                      : "border-border hover:border-secondary/50"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                      BEST VALUE
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${isPopular ? "bg-secondary/20" : "bg-muted"}`}>
                        <Icon className={`w-5 h-5 ${isPopular ? "text-secondary" : "text-muted-foreground"}`} />
                      </div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">${Number(pkg.price_usd).toFixed(0)}</span>
                        <span className="text-muted-foreground text-sm">USD</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pkg.credits} credits · ${perCredit}/credit
                      </p>
                    </div>

                    {savings > 0 && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                        Save {savings}%
                      </Badge>
                    )}

                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500" />
                        {pkg.credits} credits (~{pkg.credits * 30} min service)
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500" />
                        Instant delivery to wallet
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500" />
                        Never expires
                      </li>
                    </ul>

                    <Button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchasing !== null}
                      variant={isPopular ? "gold" : "default"}
                      className="w-full"
                    >
                      {purchasing === pkg.id ? "Redirecting..." : `Buy ${pkg.credits} Credits`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {loadingPkg && (
            <div className="text-center text-muted-foreground py-12">Loading packages...</div>
          )}

          {/* Info section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardContent className="pt-6 text-center">
                <Coins className="w-8 h-8 text-secondary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Secure Payments</h3>
                <p className="text-sm text-muted-foreground">
                  All payments processed securely via Stripe in test mode
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6 text-center">
                <Zap className="w-8 h-8 text-secondary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Instant Credits</h3>
                <p className="text-sm text-muted-foreground">
                  Credits added to your wallet immediately after payment
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6 text-center">
                <Star className="w-8 h-8 text-secondary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Withdraw Earnings</h3>
                <p className="text-sm text-muted-foreground">
                  Freelancers can convert earned credits to USD at $1.50/credit
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
