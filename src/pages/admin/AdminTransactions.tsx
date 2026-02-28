import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  transaction_type: string;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, amount, status, transaction_type, description, created_at, completed_at")
        .order("created_at", { ascending: false });
      setTransactions(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-secondary" /> Payment Transactions
        </h1>
        <p className="text-muted-foreground text-sm">{transactions.length} total transactions</p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{t.description || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{t.transaction_type}</Badge></TableCell>
                    <TableCell className="font-semibold">{t.amount} cr</TableCell>
                    <TableCell>
                      <Badge className={t.status === "completed" ? "bg-green-500/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(t.created_at).toLocaleDateString()}</TableCell>
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
