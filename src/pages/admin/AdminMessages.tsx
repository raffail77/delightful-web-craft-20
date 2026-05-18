import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function AdminMessages() {
  const qc = useQueryClient();
  const [view, setView] = useState<any>(null);

  const { data: msgs = [] } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-messages"] }); toast({ title: "Deleted" }); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contact Messages</h1>
      <Card>
        <CardHeader><CardTitle>Inbox ({msgs.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>From</TableHead><TableHead>Subject</TableHead><TableHead>Category</TableHead>
              <TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {msgs.map((m: any) => (
                <TableRow key={m.id} className="cursor-pointer" onClick={() => setView(m)}>
                  <TableCell>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </TableCell>
                  <TableCell>{m.subject}</TableCell>
                  <TableCell><Badge variant="outline">{m.category}</Badge></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select value={m.status} onValueChange={(v) => update.mutate({ id: m.id, status: v })}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => confirm("Delete?") && remove.mutate(m.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {msgs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No messages.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-lg">
          {view && (
            <>
              <DialogHeader><DialogTitle>{view.subject}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">From:</span> {view.name} &lt;{view.email}&gt;</div>
                <div><span className="text-muted-foreground">Category:</span> {view.category}</div>
                <div className="whitespace-pre-wrap pt-2 border-t">{view.message}</div>
                <Button asChild className="w-full mt-4"><a href={`mailto:${view.email}?subject=Re: ${encodeURIComponent(view.subject)}`}>Reply via email</a></Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
