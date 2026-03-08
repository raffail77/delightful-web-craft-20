import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, ShoppingCart,
  Banknote, AlertCircle, TrendingUp, CreditCard, Coins, Link2, CheckCircle2, Loader2,
} from "lucide-react";

interface Purchase {
  id: string;
  credits: number;
  amount_usd: number;
  status: string;
  created_at: string;
}

interface Withdrawal {
  id: string;
  credits_amount: number;
  usd_amount: number;
  fee_amount: number;
  net_amount: number;
  status: string;
  created_at: string;
}

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  created_at: string;
}

export default function Wallet() {
  const { user, loading: authLoading } = useAuth();
  const { credits, refreshCredits } = useCredits();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [connectStatus, setConnectStatus] = useState<{ connected: boolean; onboarding_complete: boolean; payouts_enabled?: boolean } | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    fetchConnectStatus();

    // Subscribe to profile changes for realtime balance updates
    const channel = supabase
      .channel("wallet-profile-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setProfile({
              time_credits: payload.new.time_credits,
              earned_credits: payload.new.earned_credits,
              bonus_credits: payload.new.bonus_credits,
              escrow_credits: payload.new.escrow_credits,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Verify payment on success redirect
  // Auto-verify any pending purchases on every wallet load
  useEffect(() => {
    if (!user) return;
    const verifyPending = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment");
        if (error) {
          console.error("Verify payment error:", error);
          return;
        }
        if (data?.credits_added > 0) {
          toast({ title: "Payment Successful!", description: `${data.credits_added} credits have been added to your wallet.` });
          refreshCredits();
          fetchAll();
        }
      } catch (err) {
        console.error("Payment verification failed:", err);
      }
    };
    verifyPending();

    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success" || params.get("connect")) {
      if (params.get("connect") === "complete") fetchConnectStatus();
      window.history.replaceState({}, "", "/wallet");
    }
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, purchasesRes, withdrawalsRes, txRes, settingsRes] = await Promise.all([
      supabase.from("profiles").select("time_credits, earned_credits, bonus_credits, escrow_credits").eq("user_id", user.id).single(),
      supabase.from("credit_purchases").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("withdrawal_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(50),
      supabase.from("platform_settings").select("key, value"),
    ]);

    setProfile(profileRes.data);
    setPurchases((purchasesRes.data as any[]) || []);
    setWithdrawals((withdrawalsRes.data as any[]) || []);
    setTransactions((txRes.data as any[]) || []);

    const s: Record<string, string> = {};
    (settingsRes.data || []).forEach((r: any) => { s[r.key] = JSON.parse(r.value); });
    setSettings(s);
    setLoading(false);
  };

  const fetchConnectStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-status");
      if (!error && data) setConnectStatus(data);
    } catch (err) {
      console.error("Connect status error:", err);
    }
  };

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboard");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start onboarding", variant: "destructive" });
    } finally {
      setConnectLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    const payoutRate = parseFloat(settings.payout_rate_usd || "1.50");
    const feePercent = parseFloat(settings.withdrawal_fee_percent || "5");
    const minCredits = parseInt(settings.min_withdrawal_credits || "10");
    const earnedCredits = profile?.earned_credits || 0;

    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" }); return;
    }
    if (amount < minCredits) {
      toast({ title: "Minimum withdrawal", description: `At least ${minCredits} credits required`, variant: "destructive" }); return;
    }
    if (amount > earnedCredits) {
      toast({ title: "Insufficient earned credits", description: `You have ${earnedCredits} earned credits eligible for withdrawal`, variant: "destructive" }); return;
    }

    setWithdrawing(true);
    const usdAmount = amount * payoutRate;
    const feeAmount = usdAmount * (feePercent / 100);
    const netAmount = usdAmount - feeAmount;

    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user!.id,
      credits_amount: amount,
      usd_amount: usdAmount,
      fee_amount: feeAmount,
      net_amount: netAmount,
      status: "pending",
    });

    setWithdrawing(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Withdrawal Requested", description: `$${netAmount.toFixed(2)} withdrawal is pending admin review` });
    setWithdrawOpen(false);
    setWithdrawAmount("");
    fetchAll();
  };

  if (authLoading) return null;

  const payoutRate = parseFloat(settings.payout_rate_usd || "1.50");
  const feePercent = parseFloat(settings.withdrawal_fee_percent || "5");
  const earnedCredits = profile?.earned_credits || 0;
  const bonusCredits = profile?.bonus_credits || 0;
  const escrowCredits = profile?.escrow_credits || 0;

  const previewAmount = parseInt(withdrawAmount) || 0;
  const previewUsd = previewAmount * payoutRate;
  const previewFee = previewUsd * (feePercent / 100);
  const previewNet = previewUsd - previewFee;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
                <WalletIcon className="w-8 h-8 text-secondary" />
                My Wallet
              </h1>
              <p className="text-muted-foreground mt-1">Manage your credits, purchases, and withdrawals</p>
            </div>
            <div className="flex gap-3">
              <Button variant="gold" asChild>
                <Link to="/buy-credits"><ShoppingCart className="w-4 h-4 mr-2" /> Buy Credits</Link>
              </Button>
              <Button variant="outline" onClick={() => setWithdrawOpen(true)}>
                <Banknote className="w-4 h-4 mr-2" /> Withdraw
              </Button>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">Total Balance</span>
                </div>
                <p className="text-2xl font-bold">{credits}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Earned</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{earnedCredits}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Bonus</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{bonusCredits}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">In Escrow</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{escrowCredits}</p>
              </CardContent>
            </Card>
          </div>

          {/* Stripe Connect Status */}
          <Card className="mb-8">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-secondary" />
                <div>
                  <p className="font-medium text-sm">Stripe Payout Account</p>
                  <p className="text-xs text-muted-foreground">
                    {!connectStatus || !connectStatus.connected
                      ? "Connect your bank account to receive withdrawal payouts"
                      : connectStatus.onboarding_complete
                        ? "Your payout account is connected and ready"
                        : "Onboarding started — complete setup to receive payouts"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {connectStatus?.onboarding_complete ? (
                  <Badge className="bg-green-500/10 text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={handleConnectStripe}
                    disabled={connectLoading}
                  >
                    {connectLoading ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Connecting...</>
                    ) : connectStatus?.connected ? (
                      "Complete Setup"
                    ) : (
                      "Connect Stripe"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                  ) : transactions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No transactions yet</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => {
                          const isSent = tx.sender_id === user?.id && tx.receiver_id !== user?.id;
                          return (
                            <TableRow key={tx.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {isSent ? (
                                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <ArrowDownLeft className="w-4 h-4 text-green-500" />
                                  )}
                                  <Badge variant="outline" className="text-xs">{tx.transaction_type}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">{tx.description || "—"}</TableCell>
                              <TableCell className={`font-semibold ${isSent ? "text-red-600" : "text-green-600"}`}>
                                {isSent ? "-" : "+"}{tx.amount} cr
                              </TableCell>
                              <TableCell>
                                <Badge className={tx.status === "completed" ? "bg-green-500/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"}>
                                  {tx.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(tx.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases">
              <Card>
                <CardContent className="p-0">
                  {purchases.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No purchases yet.{" "}
                      <Link to="/buy-credits" className="text-secondary underline">Buy credits</Link>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Credits</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-semibold">{p.credits} credits</TableCell>
                            <TableCell>${Number(p.amount_usd).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={p.status === "completed" ? "bg-green-500/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"}>
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(p.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card>
                <CardContent className="p-0">
                  {withdrawals.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No withdrawal requests yet</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Credits</TableHead>
                          <TableHead>Gross USD</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead>Net USD</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell className="font-semibold">{w.credits_amount} cr</TableCell>
                            <TableCell>${Number(w.usd_amount).toFixed(2)}</TableCell>
                            <TableCell className="text-destructive">${Number(w.fee_amount).toFixed(2)}</TableCell>
                            <TableCell className="font-semibold text-green-600">${Number(w.net_amount).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={
                                w.status === "completed" ? "bg-green-500/10 text-green-700" :
                                w.status === "rejected" ? "bg-red-500/10 text-red-700" :
                                "bg-yellow-500/10 text-yellow-700"
                              }>
                                {w.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(w.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-secondary" />
              Withdraw Credits
            </DialogTitle>
            <DialogDescription>
              Convert earned credits to USD. Only earned credits are eligible (not bonus credits).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(!connectStatus?.onboarding_complete) && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-md p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>You must <button className="underline font-medium" onClick={handleConnectStripe}>connect a Stripe account</button> before you can withdraw funds.</span>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Eligible credits: <span className="font-semibold text-foreground">{earnedCredits}</span>
              <br />
              Payout rate: <span className="font-semibold text-foreground">${payoutRate}/credit</span>
              <br />
              Processing fee: <span className="font-semibold text-foreground">{feePercent}%</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Credits to withdraw</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min="1"
                max={earnedCredits}
                placeholder="Enter credits"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={withdrawing}
              />
            </div>

            {previewAmount > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="py-3 px-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Gross:</span><span>${previewUsd.toFixed(2)}</span></div>
                  <div className="flex justify-between text-destructive"><span>Fee ({feePercent}%):</span><span>-${previewFee.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-green-600 border-t pt-1"><span>You receive:</span><span>${previewNet.toFixed(2)}</span></div>
                </CardContent>
              </Card>
            )}

            {earnedCredits === 0 && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>You have no earned credits eligible for withdrawal. Only credits earned from completed paid services can be withdrawn.</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button
              variant="gold"
              onClick={handleWithdraw}
              disabled={withdrawing || earnedCredits === 0 || !withdrawAmount || !connectStatus?.onboarding_complete}
            >
              {withdrawing ? "Processing..." : "Request Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
