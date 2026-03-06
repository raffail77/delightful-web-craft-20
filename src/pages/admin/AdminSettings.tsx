import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings, Package, Banknote, Save, DollarSign } from "lucide-react";

interface PlatformSetting {
  id: string;
  key: string;
  value: string;
}

interface CreditPkg {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
  is_active: boolean;
  sort_order: number;
}

interface WithdrawalReq {
  id: string;
  user_id: string;
  credits_amount: number;
  usd_amount: number;
  fee_amount: number;
  net_amount: number;
  status: string;
  created_at: string;
  notes: string | null;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [packages, setPackages] = useState<CreditPkg[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSettings, setEditSettings] = useState<Record<string, string>>({});
  const [editPkg, setEditPkg] = useState<CreditPkg | null>(null);
  const [pkgForm, setPkgForm] = useState({ name: "", credits: "", price_usd: "", sort_order: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [sRes, pRes, wRes] = await Promise.all([
      supabase.from("platform_settings").select("*"),
      supabase.from("credit_packages").select("*").order("sort_order"),
      supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false }),
    ]);
    const s = (sRes.data as any[]) || [];
    setSettings(s);
    const ed: Record<string, string> = {};
    s.forEach((r: any) => { ed[r.key] = JSON.parse(r.value); });
    setEditSettings(ed);
    setPackages((pRes.data as any[]) || []);
    setWithdrawals((wRes.data as any[]) || []);
    setLoading(false);
  };

  const saveSetting = async (key: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_settings")
      .update({ value: JSON.stringify(editSettings[key]), updated_at: new Date().toISOString() })
      .eq("key", key);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Saved", description: `${key} updated` });
  };

  const handleWithdrawalAction = async (id: string, action: "completed" | "rejected") => {
    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status: action, processed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Withdrawal ${action}` }); fetchAll(); }
  };

  const openEditPkg = (p: CreditPkg) => {
    setEditPkg(p);
    setPkgForm({ name: p.name, credits: String(p.credits), price_usd: String(p.price_usd), sort_order: String(p.sort_order) });
  };

  const savePkg = async () => {
    if (!editPkg) return;
    const { error } = await supabase
      .from("credit_packages")
      .update({
        name: pkgForm.name,
        credits: parseInt(pkgForm.credits),
        price_usd: parseFloat(pkgForm.price_usd),
        sort_order: parseInt(pkgForm.sort_order),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editPkg.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Package updated" }); setEditPkg(null); fetchAll(); }
  };

  const togglePkg = async (id: string, active: boolean) => {
    await supabase.from("credit_packages").update({ is_active: !active }).eq("id", id);
    fetchAll();
  };

  const SETTING_LABELS: Record<string, string> = {
    credit_value_usd: "Credit Value (USD)",
    payout_rate_usd: "Payout Rate (USD/credit)",
    withdrawal_fee_percent: "Withdrawal Fee (%)",
    platform_commission_percent: "Platform Commission (%)",
    min_withdrawal_credits: "Min Withdrawal Credits",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-secondary" /> Platform Settings
        </h1>
        <p className="text-muted-foreground text-sm">Configure credit pricing, commissions, and manage withdrawals</p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="packages">Credit Packages</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.filter(w => w.status === "pending").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5" /> Pricing & Fees</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(SETTING_LABELS).map((key) => (
                <div key={key} className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <Label>{SETTING_LABELS[key]}</Label>
                    <Input
                      value={editSettings[key] || ""}
                      onChange={(e) => setEditSettings({ ...editSettings, [key]: e.target.value })}
                    />
                  </div>
                  <Button size="sm" onClick={() => saveSetting(key)} disabled={saving}>
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Package className="w-5 h-5" /> Credit Packages</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Per Credit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.credits}</TableCell>
                      <TableCell>${Number(p.price_usd).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">${(Number(p.price_usd) / p.credits).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={p.is_active ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}>
                          {p.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditPkg(p)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => togglePkg(p.id, p.is_active)}>
                          {p.is_active ? "Disable" : "Enable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Banknote className="w-5 h-5" /> Withdrawal Requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              {withdrawals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No withdrawal requests</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs font-mono truncate max-w-[100px]">{w.user_id}</TableCell>
                        <TableCell>{w.credits_amount}</TableCell>
                        <TableCell>${Number(w.usd_amount).toFixed(2)}</TableCell>
                        <TableCell className="text-destructive">${Number(w.fee_amount).toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">${Number(w.net_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={
                            w.status === "completed" ? "bg-green-500/10 text-green-700" :
                            w.status === "rejected" ? "bg-red-500/10 text-red-700" :
                            "bg-yellow-500/10 text-yellow-700"
                          }>{w.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {w.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="default" onClick={() => handleWithdrawalAction(w.id, "completed")}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleWithdrawalAction(w.id, "rejected")}>Reject</Button>
                            </div>
                          )}
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

      {/* Edit Package Dialog */}
      <Dialog open={!!editPkg} onOpenChange={() => setEditPkg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Package</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} /></div>
            <div><Label>Credits</Label><Input type="number" value={pkgForm.credits} onChange={(e) => setPkgForm({ ...pkgForm, credits: e.target.value })} /></div>
            <div><Label>Price (USD)</Label><Input type="number" step="0.01" value={pkgForm.price_usd} onChange={(e) => setPkgForm({ ...pkgForm, price_usd: e.target.value })} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={pkgForm.sort_order} onChange={(e) => setPkgForm({ ...pkgForm, sort_order: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPkg(null)}>Cancel</Button>
            <Button onClick={savePkg}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
