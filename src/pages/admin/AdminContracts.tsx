import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Contract {
  id: string;
  title: string;
  status: string;
  agreed_credits: number;
  provider_confirmed: boolean;
  client_confirmed: boolean;
  created_at: string;
  completed_at: string | null;
}

export default function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("contracts")
        .select("id, title, status, agreed_credits, provider_confirmed, client_confirmed, created_at, completed_at")
        .order("created_at", { ascending: false });
      setContracts(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-700";
      case "in_progress": return "bg-blue-500/10 text-blue-700";
      case "proposed": case "accepted": return "bg-yellow-500/10 text-yellow-700";
      case "cancelled": case "disputed": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-secondary" /> Contract Management
        </h1>
        <p className="text-muted-foreground text-sm">{contracts.length} total contracts</p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Provider OK</TableHead>
                  <TableHead>Client OK</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                    <TableCell><Badge className={`text-xs ${getStatusColor(c.status)}`}>{c.status}</Badge></TableCell>
                    <TableCell>{c.agreed_credits} cr</TableCell>
                    <TableCell>{c.provider_confirmed ? "✓" : "—"}</TableCell>
                    <TableCell>{c.client_confirmed ? "✓" : "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "—"}</TableCell>
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
