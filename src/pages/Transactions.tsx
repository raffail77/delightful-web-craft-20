import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft, Clock, Coins, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  created_at: string;
  completed_at: string | null;
  service_id: string | null;
  sender_profile?: { full_name: string | null; email: string | null };
  receiver_profile?: { full_name: string | null; email: string | null };
}

interface Profile {
  time_credits: number;
  full_name: string | null;
}

export default function Transactions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("time_credits, full_name")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (txError) throw txError;

      // Fetch profiles for all unique user IDs
      const userIds = new Set<string>();
      txData?.forEach((tx) => {
        userIds.add(tx.sender_id);
        userIds.add(tx.receiver_id);
      });

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", Array.from(userIds));

      if (profilesError) throw profilesError;

      // Map profiles to transactions
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
      const enrichedTx = txData?.map((tx) => ({
        ...tx,
        sender_profile: profileMap.get(tx.sender_id),
        receiver_profile: profileMap.get(tx.receiver_id),
      })) || [];

      setTransactions(enrichedTx);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load transaction data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sentTransactions = transactions.filter((tx) => tx.sender_id === user?.id);
  const receivedTransactions = transactions.filter((tx) => tx.receiver_id === user?.id);

  const totalSent = sentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalReceived = receivedTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "disputed":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const TransactionItem = ({ tx, type }: { tx: Transaction; type: "sent" | "received" }) => {
    const isSent = type === "sent";
    const otherParty = isSent ? tx.receiver_profile : tx.sender_profile;
    const otherName = otherParty?.full_name || otherParty?.email || "Unknown User";

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full ${isSent ? "bg-red-500/10" : "bg-green-500/10"}`}>
            {isSent ? (
              <ArrowUpRight className="h-5 w-5 text-red-500" />
            ) : (
              <ArrowDownLeft className="h-5 w-5 text-green-500" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {isSent ? `To: ${otherName}` : `From: ${otherName}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {tx.description || tx.transaction_type.replace("_", " ")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(tx.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className={getStatusColor(tx.status)}>
            {tx.status}
          </Badge>
          <span className={`font-bold text-lg ${isSent ? "text-red-500" : "text-green-500"}`}>
            {isSent ? "-" : "+"}{tx.amount}
          </span>
        </div>
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="flex items-center justify-center h-64">
            <Clock className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
            <p className="text-muted-foreground">
              Track your time credit transfers and earnings
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Current Balance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {profile?.time_credits || 0}
                </p>
                <p className="text-sm text-muted-foreground">credits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Total Earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">+{totalReceived}</p>
                <p className="text-sm text-muted-foreground">
                  from {receivedTransactions.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Total Spent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-500">-{totalSent}</p>
                <p className="text-sm text-muted-foreground">
                  from {sentTransactions.length} transactions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
                  <TabsTrigger value="received">Received ({receivedTransactions.length})</TabsTrigger>
                  <TabsTrigger value="sent">Sent ({sentTransactions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions yet</p>
                      <p className="text-sm">Start exchanging services to see your history</p>
                      <Button className="mt-4" onClick={() => navigate("/marketplace")}>
                        Browse Marketplace
                      </Button>
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <TransactionItem
                        key={tx.id}
                        tx={tx}
                        type={tx.sender_id === user?.id ? "sent" : "received"}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="received" className="space-y-3">
                  {receivedTransactions.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No received transactions</p>
                  ) : (
                    receivedTransactions.map((tx) => (
                      <TransactionItem key={tx.id} tx={tx} type="received" />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="sent" className="space-y-3">
                  {sentTransactions.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No sent transactions</p>
                  ) : (
                    sentTransactions.map((tx) => (
                      <TransactionItem key={tx.id} tx={tx} type="sent" />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
