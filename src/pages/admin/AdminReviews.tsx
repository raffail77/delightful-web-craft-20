import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string | null;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, title, content, created_at")
        .order("created_at", { ascending: false });
      setReviews(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <Star className="h-6 w-6 text-secondary" /> Review Moderation
        </h1>
        <p className="text-muted-foreground text-sm">{reviews.length} total reviews</p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No reviews yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title || "Untitled"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-secondary text-secondary" : "text-muted"}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground text-sm">{r.content || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</TableCell>
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
