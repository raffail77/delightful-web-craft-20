import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
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

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const empty = { title: "", slug: "", excerpt: "", content: "", thumbnail_url: "", category: "", tags: "", status: "draft", author_name: "" };

export default function AdminBlog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [mediaKitFile, setMediaKitFile] = useState<File | null>(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: mediaKit } = useQuery({
    queryKey: ["admin-media-kit"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("*").eq("key", "media_kit").maybeSingle();
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      let thumbnail_url = form.thumbnail_url || null;
      if (thumbFile) {
        const path = `${Date.now()}-${thumbFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("blog-thumbnails").upload(path, thumbFile);
        if (upErr) throw upErr;
        thumbnail_url = supabase.storage.from("blog-thumbnails").getPublicUrl(path).data.publicUrl;
      }
      const tags = form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
      const payload: any = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || null,
        content: form.content,
        thumbnail_url,
        category: form.category || null,
        tags,
        status: form.status,
        author_name: form.author_name || null,
        published_at: form.status === "published" ? (editing?.published_at || new Date().toISOString()) : null,
      };
      if (editing) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      qc.invalidateQueries({ queryKey: ["press-posts"] });
      setOpen(false); setEditing(null); setForm(empty); setThumbFile(null);
      toast({ title: editing ? "Post updated" : "Post created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-posts"] }); qc.invalidateQueries({ queryKey: ["blog-posts"] }); toast({ title: "Deleted" }); },
  });

  const uploadMediaKit = useMutation({
    mutationFn: async () => {
      if (!mediaKitFile) throw new Error("Pick a file");
      const path = `media-kit-${Date.now()}-${mediaKitFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("media-kit").upload(path, mediaKitFile);
      if (upErr) throw upErr;
      const url = supabase.storage.from("media-kit").getPublicUrl(path).data.publicUrl;
      const value = { url, name: mediaKitFile.name };
      const { data: existing } = await supabase.from("platform_settings").select("id").eq("key", "media_kit").maybeSingle();
      if (existing) {
        await supabase.from("platform_settings").update({ value }).eq("id", existing.id);
      } else {
        await supabase.from("platform_settings").insert({ key: "media_kit", value });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-media-kit"] });
      qc.invalidateQueries({ queryKey: ["media-kit"] });
      setMediaKitFile(null);
      toast({ title: "Media kit uploaded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMediaKit = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase.from("platform_settings").select("id").eq("key", "media_kit").maybeSingle();
      if (existing) await supabase.from("platform_settings").delete().eq("id", existing.id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-media-kit"] }); qc.invalidateQueries({ queryKey: ["media-kit"] }); toast({ title: "Removed" }); },
  });

  const openCreate = () => { setEditing(null); setForm(empty); setThumbFile(null); setOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt ?? "", content: p.content,
      thumbnail_url: p.thumbnail_url ?? "", category: p.category ?? "",
      tags: (p.tags ?? []).join(", "), status: p.status, author_name: p.author_name ?? "",
    });
    setThumbFile(null);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Blog & Press</h1>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="media">Media Kit</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Articles</CardTitle>
              <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New post</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead>
                  <TableHead>Views</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {posts.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{p.category ?? "—"}</TableCell>
                      <TableCell><Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                      <TableCell>{p.view_count}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => confirm("Delete?") && remove.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {posts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No posts yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader><CardTitle>Media Kit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {mediaKit?.value && (mediaKit.value as any).url ? (
                <div className="flex items-center justify-between p-4 border rounded">
                  <a href={(mediaKit.value as any).url} target="_blank" rel="noreferrer" className="text-gold underline">
                    {(mediaKit.value as any).name || "Current media kit"}
                  </a>
                  <Button variant="destructive" size="sm" onClick={() => removeMediaKit.mutate()}>Remove</Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No media kit uploaded.</p>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Upload new (PDF, ZIP, etc.)</Label>
                  <Input type="file" onChange={(e) => setMediaKitFile(e.target.files?.[0] ?? null)} />
                </div>
                <Button onClick={() => uploadMediaKit.mutate()} disabled={!mediaKitFile || uploadMediaKit.isPending}>
                  <Upload className="w-4 h-4 mr-2" />Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit post" : "New post"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Author</Label><Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Guide, Press" /></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Excerpt</Label><Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Content</Label><Textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-2">
              <Label>Thumbnail</Label>
              <Input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)} />
              {form.thumbnail_url && !thumbFile && <img src={form.thumbnail_url} alt="" className="w-32 h-20 object-cover rounded mt-2" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
