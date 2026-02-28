import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Briefcase,
  FileCheck,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
  Users,
  Activity,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  totalEarned: number;
  totalSpent: number;
  servicesOffered: number;
  servicesRequested: number;
  completedContracts: number;
  activeContracts: number;
  pendingContracts: number;
  avgRating: number;
  totalReviews: number;
  followersCount: number;
}

interface RecentActivity {
  id: string;
  type: "earned" | "spent" | "contract" | "review";
  description: string;
  amount?: number;
  date: string;
}

const CHART_COLORS = [
  "hsl(var(--secondary))",
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { credits, isLoading: creditsLoading } = useCredits();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; earned: number; spent: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const [
        { data: txReceived },
        { data: txSent },
        { data: servicesData },
        { data: contractsData },
        { data: reviewsData },
        { data: followersData },
      ] = await Promise.all([
        supabase.from("transactions").select("amount, created_at, description, status").eq("receiver_id", user.id).eq("status", "completed"),
        supabase.from("transactions").select("amount, created_at, description, status").eq("sender_id", user.id).eq("status", "completed"),
        supabase.from("services").select("id, service_type").eq("user_id", user.id).eq("is_active", true),
        supabase.from("contracts").select("id, status, title, created_at, agreed_credits").or(`provider_id.eq.${user.id},client_id.eq.${user.id}`),
        supabase.from("reviews").select("rating").eq("reviewee_id", user.id),
        supabase.from("followers").select("id").eq("following_id", user.id),
      ]);

      const totalEarned = (txReceived || []).reduce((s, t) => s + t.amount, 0);
      const totalSpent = (txSent || []).reduce((s, t) => s + t.amount, 0);
      const offers = (servicesData || []).filter((s) => s.service_type === "offer").length;
      const requests = (servicesData || []).filter((s) => s.service_type === "request").length;
      const completed = (contractsData || []).filter((c) => c.status === "completed").length;
      const active = (contractsData || []).filter((c) => c.status === "in_progress").length;
      const pending = (contractsData || []).filter((c) => c.status === "proposed" || c.status === "accepted").length;
      const ratings = (reviewsData || []).map((r) => r.rating);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      setStats({
        totalEarned,
        totalSpent,
        servicesOffered: offers,
        servicesRequested: requests,
        completedContracts: completed,
        activeContracts: active,
        pendingContracts: pending,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: ratings.length,
        followersCount: (followersData || []).length,
      });

      // Monthly chart data (last 6 months)
      const months: { month: string; earned: number; spent: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString("default", { month: "short" });
        const yr = d.getFullYear();
        const mo = d.getMonth();
        const earned = (txReceived || []).filter((t) => {
          const td = new Date(t.created_at);
          return td.getFullYear() === yr && td.getMonth() === mo;
        }).reduce((s, t) => s + t.amount, 0);
        const spent = (txSent || []).filter((t) => {
          const td = new Date(t.created_at);
          return td.getFullYear() === yr && td.getMonth() === mo;
        }).reduce((s, t) => s + t.amount, 0);
        months.push({ month: key, earned, spent });
      }
      setMonthlyData(months);

      // Recent activity
      const activities: RecentActivity[] = [];
      (txReceived || []).slice(0, 3).forEach((t) =>
        activities.push({ id: `e-${t.created_at}`, type: "earned", description: t.description || "Credits received", amount: t.amount, date: t.created_at })
      );
      (txSent || []).slice(0, 3).forEach((t) =>
        activities.push({ id: `s-${t.created_at}`, type: "spent", description: t.description || "Credits sent", amount: t.amount, date: t.created_at })
      );
      (contractsData || []).slice(0, 3).forEach((c) =>
        activities.push({ id: `c-${c.id}`, type: "contract", description: c.title, amount: c.agreed_credits, date: c.created_at })
      );
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 8));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  const contractPieData = stats
    ? [
        { name: "Completed", value: stats.completedContracts },
        { name: "Active", value: stats.activeContracts },
        { name: "Pending", value: stats.pendingContracts },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your activity overview and analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Coins}
            label="Credit Balance"
            value={creditsLoading ? "..." : credits.toString()}
            loading={isLoading}
            accent
          />
          <StatCard
            icon={TrendingUp}
            label="Total Earned"
            value={stats?.totalEarned.toString() || "0"}
            subtitle="credits"
            loading={isLoading}
          />
          <StatCard
            icon={TrendingDown}
            label="Total Spent"
            value={stats?.totalSpent.toString() || "0"}
            subtitle="credits"
            loading={isLoading}
          />
          <StatCard
            icon={FileCheck}
            label="Completed"
            value={stats?.completedContracts.toString() || "0"}
            subtitle="contracts"
            loading={isLoading}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <MiniStat icon={Briefcase} label="Services Offered" value={stats?.servicesOffered || 0} loading={isLoading} />
          <MiniStat icon={Clock} label="Active Contracts" value={stats?.activeContracts || 0} loading={isLoading} />
          <MiniStat icon={Star} label="Avg Rating" value={stats?.avgRating || 0} loading={isLoading} />
          <MiniStat icon={Users} label="Followers" value={stats?.followersCount || 0} loading={isLoading} />
        </div>

        {/* Charts + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credits Chart */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Credits Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ChartContainer config={{ earned: { label: "Earned", color: "hsl(var(--secondary))" }, spent: { label: "Spent", color: "hsl(var(--primary))" } }} className="h-64 w-full">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis tickLine={false} axisLine={false} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="earned" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Contract Breakdown */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Contract Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-48 w-48 rounded-full" />
              ) : contractPieData.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No contracts yet</p>
              ) : (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={contractPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {contractPieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-secondary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No recent activity. Start by browsing the marketplace!</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-full ${a.type === "earned" ? "bg-secondary/20 text-secondary" : a.type === "spent" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {a.type === "earned" ? <ArrowDownLeft className="h-4 w-4" /> : a.type === "spent" ? <ArrowUpRight className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</p>
                    </div>
                    {a.amount && (
                      <Badge variant={a.type === "earned" ? "default" : "secondary"} className="shrink-0">
                        {a.type === "earned" ? "+" : a.type === "spent" ? "-" : ""}{a.amount} credits
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, loading, accent }: { icon: any; label: string; value: string; subtitle?: string; loading: boolean; accent?: boolean }) {
  return (
    <Card className={`shadow-soft hover-lift ${accent ? "border-secondary/30 bg-gradient-card" : ""}`}>
      <CardContent className="p-5">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${accent ? "text-gradient-gold" : "text-foreground"}`}>{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={`p-2 rounded-lg ${accent ? "bg-secondary/20" : "bg-muted"}`}>
              <Icon className={`h-5 w-5 ${accent ? "text-secondary" : "text-muted-foreground"}`} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value, loading }: { icon: any; label: string; value: number; loading: boolean }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 flex items-center gap-3">
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <>
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
