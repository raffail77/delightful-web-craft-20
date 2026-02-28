import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Service {
  id: string;
  title: string;
  category: string;
  service_type: string;
  hourly_credits: number;
  is_active: boolean;
  is_remote: boolean;
  created_at: string;
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, title, category, service_type, hourly_credits, is_active, is_remote, created_at")
        .order("created_at", { ascending: false });
      setServices(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-secondary" /> Service Requests
        </h1>
        <p className="text-muted-foreground text-sm">{services.length} total services</p>
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
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credits/hr</TableHead>
                  <TableHead>Remote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{s.title}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{s.category}</Badge></TableCell>
                    <TableCell>
                      <Badge className={s.service_type === "offer" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}>
                        {s.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.hourly_credits}</TableCell>
                    <TableCell>{s.is_remote ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Badge className={s.is_active ? "bg-green-500/10 text-green-700" : "bg-destructive/10 text-destructive"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(s.created_at).toLocaleDateString()}</TableCell>
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
