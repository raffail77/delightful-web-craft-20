import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SLUGS = ["privacy", "terms", "cookies"] as const;
type Slug = typeof SLUGS[number];

function DocEditor({ slug }: { slug: Slug }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-legal", slug],
    queryFn: async () => (await supabase.from("legal_documents").select("*").eq("slug", slug).maybeSingle()).data,
  });
  const [form, setForm] = useState({ title: "", content: "", version: "1.0" });

  useEffect(() => {
    if (data) setForm({ title: data.title, content: data.content, version: data.version });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("legal_documents")
        .update({ title: form.title, content: form.content, version: form.version })
        .eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-legal", slug] });
      qc.invalidateQueries({ queryKey: ["legal", slug] });
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="capitalize">{slug} Document</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><Label>Version</Label><Input value={form.version} onChange={e => setForm({...form, version: e.target.value})} /></div>
        </div>
        <div>
          <Label>Content (Markdown — use # for title, ## for headings, - for lists)</Label>
          <Textarea rows={20} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="font-mono text-sm" />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
      </CardContent>
    </Card>
  );
}

export default function AdminLegal() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Legal Documents</h1>
      <Tabs defaultValue="privacy">
        <TabsList>
          {SLUGS.map(s => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
        </TabsList>
        {SLUGS.map(s => (
          <TabsContent key={s} value={s}><DocEditor slug={s} /></TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
