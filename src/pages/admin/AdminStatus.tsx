import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const incEmpty = { title: "", description: "", status: "investigating", severity: "minor", resolved_at: "" };
const svcEmpty = { name: "", status: "operational", uptime_percentage: 100, sort_order: 0 };

export default function AdminStatus() {
  const qc = useQueryClient();
  const [incOpen, setIncOpen] = useState(false);
  const [editingInc, setEditingInc] = useState<any>(null);
  const [incForm, setIncForm] = useState<any>(incEmpty);
  const [svcOpen, setSvcOpen] = useState(false);
  const [editingSvc, setEditingSvc] = useState<any>(null);
  const [svcForm, setSvcForm] = useState<any>(svcEmpty);

  const { data: services = [] } = useQuery({
    queryKey: ["admin-svc"],
    queryFn: async () => (await supabase.from("service_status").select("*").order("sort_order")).data || [],
  });
  const { data: incidents = [] } = useQuery({
    queryKey: ["admin-inc"],
    queryFn: async () => (await supabase.from("incidents").select("*").order("started_at", { ascending: false })).data || [],
  });

  const saveInc = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: incForm.title,
        description: incForm.description || null,
        status: incForm.status,
        severity: incForm.severity,
        resolved_at: incForm.resolved_at || null,
      };
      if (editingInc) {
        const { error } = await supabase.from("incidents").update(payload).eq("id", editingInc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("incidents").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-inc"] });
      qc.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Saved" });
      setIncOpen(false); setEditingInc(null); setIncForm(incEmpty);
    },
  });

  const delInc = useMutation({
    mutationFn: async (id: string) => { await supabase.from("incidents").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-inc"] }); qc.invalidateQueries({ queryKey: ["incidents"] }); },
  });

  const saveSvc = useMutation({
    mutationFn: async () => {
      const payload = {
        name: svcForm.name,
        status: svcForm.status,
        uptime_percentage: Number(svcForm.uptime_percentage) || 0,
        sort_order: Number(svcForm.sort_order) || 0,
      };
      if (editingSvc) {
        const { error } = await supabase.from("service_status").update(payload).eq("id", editingSvc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_status").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-svc"] });
      qc.invalidateQueries({ queryKey: ["service-status"] });
      toast({ title: "Saved" });
      setSvcOpen(false); setEditingSvc(null); setSvcForm(svcEmpty);
    },
  });

  const delSvc = useMutation({
    mutationFn: async (id: string) => { await supabase.from("service_status").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-svc"] }); qc.invalidateQueries({ queryKey: ["service-status"] }); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Status</h1>
      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingSvc(null); setSvcForm(svcEmpty); setSvcOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
          </div>
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Uptime</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {services.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell><Badge>{s.status}</Badge></TableCell>
                    <TableCell>{Number(s.uptime_percentage).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingSvc(s); setSvcForm(s); setSvcOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => delSvc.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingInc(null); setIncForm(incEmpty); setIncOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Report Incident</Button>
          </div>
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Severity</TableHead><TableHead>Started</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {incidents.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.title}</TableCell>
                    <TableCell><Badge variant={i.status === "resolved" ? "secondary" : "default"}>{i.status}</Badge></TableCell>
                    <TableCell>{i.severity}</TableCell>
                    <TableCell>{new Date(i.started_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingInc(i); setIncForm({ ...i, resolved_at: i.resolved_at ? i.resolved_at.slice(0, 16) : "" }); setIncOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => delInc.mutate(i.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={svcOpen} onOpenChange={setSvcOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSvc ? "Edit" : "New"} Service</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={svcForm.name} onChange={e => setSvcForm({...svcForm, name: e.target.value})} /></div>
            <div>
              <Label>Status</Label>
              <Select value={svcForm.status} onValueChange={v => setSvcForm({...svcForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="degraded">Degraded</SelectItem>
                  <SelectItem value="partial_outage">Partial Outage</SelectItem>
                  <SelectItem value="major_outage">Major Outage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Uptime %</Label><Input type="number" step="0.01" value={svcForm.uptime_percentage} onChange={e => setSvcForm({...svcForm, uptime_percentage: e.target.value})} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={svcForm.sort_order} onChange={e => setSvcForm({...svcForm, sort_order: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSvcOpen(false)}>Cancel</Button>
            <Button onClick={() => saveSvc.mutate()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={incOpen} onOpenChange={setIncOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingInc ? "Edit" : "New"} Incident</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={incForm.title} onChange={e => setIncForm({...incForm, title: e.target.value})} /></div>
            <div><Label>Description</Label><Textarea rows={4} value={incForm.description} onChange={e => setIncForm({...incForm, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={incForm.status} onValueChange={v => setIncForm({...incForm, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={incForm.severity} onValueChange={v => setIncForm({...incForm, severity: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Resolved At (optional)</Label><Input type="datetime-local" value={incForm.resolved_at} onChange={e => setIncForm({...incForm, resolved_at: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIncOpen(false)}>Cancel</Button>
            <Button onClick={() => saveInc.mutate()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
