import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const empty = {
  name: "", description: "", price_monthly: 0, price_yearly: "",
  features: "", cta_label: "Get Started", is_popular: false, is_active: true, sort_order: 0,
};

export default function AdminPricing() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing_plans").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        price_monthly: Number(form.price_monthly) || 0,
        price_yearly: form.price_yearly ? Number(form.price_yearly) : null,
        features: form.features.split("\n").map((s: string) => s.trim()).filter(Boolean),
        cta_label: form.cta_label,
        is_popular: form.is_popular,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        const { error } = await supabase.from("pricing_plans").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pricing_plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      qc.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast({ title: editing ? "Plan updated" : "Plan created" });
      setOpen(false);
      setEditing(null);
      setForm(empty);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      qc.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast({ title: "Deleted" });
    },
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      ...p,
      price_yearly: p.price_yearly ?? "",
      features: (Array.isArray(p.features) ? p.features : []).join("\n"),
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pricing Plans</h1>
        <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Plan
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Plans</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Price/mo</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.name} {p.is_popular && <Badge className="ml-2">Popular</Badge>}
                  </TableCell>
                  <TableCell>${p.price_monthly}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Plan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price /mo (USD)</Label><Input type="number" value={form.price_monthly} onChange={e => setForm({...form, price_monthly: e.target.value})} /></div>
              <div><Label>Price /yr (optional)</Label><Input type="number" value={form.price_yearly} onChange={e => setForm({...form, price_yearly: e.target.value})} /></div>
            </div>
            <div><Label>Features (one per line)</Label><Textarea rows={6} value={form.features} onChange={e => setForm({...form, features: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CTA Label</Label><Input value={form.cta_label} onChange={e => setForm({...form, cta_label: e.target.value})} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} /></div>
            </div>
            <div className="flex items-center justify-between"><Label>Popular</Label><Switch checked={form.is_popular} onCheckedChange={v => setForm({...form, is_popular: v})} /></div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
