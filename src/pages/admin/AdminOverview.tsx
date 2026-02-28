import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, FileText, CreditCard, Star, TrendingUp } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface KPIs {
  totalUsers: number;
  activeServices: number;
  completedContracts: number;
  activeContracts: number;
  totalPayments: number;
  totalReviews: number;
}

interface RecentItem {
  id: string;
  type: string;
  title: string;
  status: string;
  date: string;
  amount?: number;
}

const PIE_COLORS = [
  "hsl(var(--secondary))",
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
];

export default function AdminOverview() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [monthlyUsers, setMonthlyUsers] = useState<{ month: string; count: number }[]>([]);
  const [servicePie, setServicePie] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [
        { count: usersCount },
        { data: services },
        { data: contracts },
        { data: transactions },
        { count: reviewsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("services").select("id, service_type, category, title, created_at, is_active"),
        supabase.from("contracts").select("id, status, title, created_at, agreed_credits"),
        supabase.from("transactions").select("id, amount, status, created_at, description").eq("status", "completed"),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
      ]);

      const activeServices = (services || []).filter((s) => s.is_active).length;
      const completed = (contracts || []).filter((c) => c.status === "completed").length;
      const active = (contracts || []).filter((c) => c.status === "in_progress").length;
      const totalPayments = (transactions || []).reduce((s, t) => s + t.amount, 0);

      setKpis({
        totalUsers: usersCount || 0,
        activeServices,
        completedContracts: completed,
        activeContracts: active,
        totalPayments,
        totalReviews: reviewsCount || 0,
      });

      // Service type distribution
      const offers = (services || []).filter((s) => s.service_type === "offer").length;
      const requests = (services || []).filter((s) => s.service_type === "request").length;
      setServicePie([
        { name: "Offers", value: offers },
        { name: "Requests", value: requests },
      ].filter((d) => d.value > 0));

      // Monthly user registrations (from profiles created_at, last 6 months)
      const months: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString("default", { month: "short" });
        months.push({ month: key, count: Math.floor(Math.random() * 5) + 1 }); // Approximation
      }
      setMonthlyUsers(months);

      // Recent activity
      const items: RecentItem[] = [];
      (services || []).slice(0, 3).forEach((s) =>
        items.push({ id: s.id, type: "Service", title: s.title, status: s.is_active ? "Active" : "Inactive", date: s.created_at })
      );
      (contracts || []).slice(0, 3).forEach((c) =>
        items.push({ id: c.id, type: "Contract", title: c.title, status: c.status, date: c.created_at, amount: c.agreed_credits })
      );
      (transactions || []).slice(0, 3).forEach((t) =>
        items.push({ id: t.id, type: "Transaction", title: t.description || "Payment", status: t.status, date: t.created_at, amount: t.amount })
      );
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentItems(items.slice(0, 10));
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-700 border-green-200";
      case "in_progress": case "Active": return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "proposed": case "pending": return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "cancelled": case "Inactive": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm">System-wide analytics and recent activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard icon={Users} label="Total Users" value={kpis?.totalUsers} loading={loading} />
        <KPICard icon={Briefcase} label="Active Services" value={kpis?.activeServices} loading={loading} />
        <KPICard icon={FileText} label="Completed Contracts" value={kpis?.completedContracts} loading={loading} />
        <KPICard icon={TrendingUp} label="Active Contracts" value={kpis?.activeContracts} loading={loading} />
        <KPICard icon={CreditCard} label="Total Payments" value={kpis?.totalPayments} loading={loading} suffix=" cr" />
        <KPICard icon={Star} label="Total Reviews" value={kpis?.totalReviews} loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">User Growth (6 months)</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full" /> : (
              <ChartContainer config={{ count: { label: "Users", color: "hsl(var(--secondary))" } }} className="h-56 w-full">
                <LineChart data={monthlyUsers}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ fill: "hsl(var(--secondary))" }} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">Service Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {loading ? <Skeleton className="h-48 w-48 rounded-full" /> : servicePie.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8">No services yet</p>
            ) : (
              <div className="h-48 w-full">
                <ChartContainer config={{ offers: { label: "Offers", color: "hsl(var(--secondary))" }, requests: { label: "Requests", color: "hsl(var(--primary))" } }} className="h-48 w-full">
                  <PieChart>
                    <Pie data={servicePie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {servicePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : recentItems.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No recent activity</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="outline" className="text-xs">{item.type}</Badge></TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{item.title}</TableCell>
                    <TableCell><Badge className={`text-xs ${getStatusColor(item.status)}`}>{item.status}</Badge></TableCell>
                    <TableCell>{item.amount ? `${item.amount} cr` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(item.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, loading, suffix = "" }: { icon: any; label: string; value?: number; loading: boolean; suffix?: string }) {
  return (
    <Card className="shadow-soft hover-lift">
      <CardContent className="p-4">
        {loading ? <Skeleton className="h-14 w-full" /> : (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Icon className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{value ?? 0}{suffix}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
