import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  author_name: string | null;
  view_count: number;
};

const Blog = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,thumbnail_url,category,tags,published_at,author_name,view_count")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))) as string[];

  const filtered = posts.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${p.title} ${p.excerpt ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const popular = [...posts].sort((a, b) => b.view_count - a.view_count).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              TimeBank <span className="text-gold">Blog</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Insights, guides, and stories from the TimeBank community.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-8 max-w-6xl mx-auto">
            <div>
              <div className="grid md:grid-cols-3 gap-3 mb-8">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
                ) : filtered.length === 0 ? (
                  <Card className="md:col-span-2"><CardContent className="py-16 text-center text-muted-foreground">
                    {posts.length === 0 ? "No articles published yet." : "No articles match your search."}
                  </CardContent></Card>
                ) : (
                  filtered.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`}>
                      <Card className="overflow-hidden hover:border-gold transition-colors h-full">
                        {post.thumbnail_url && (
                          <img src={post.thumbnail_url} alt={post.title} className="w-full h-48 object-cover" loading="lazy" />
                        )}
                        <CardHeader>
                          {post.category && <Badge variant="secondary" className="w-fit mb-2">{post.category}</Badge>}
                          <CardTitle className="text-xl leading-tight">{post.title}</CardTitle>
                          {post.excerpt && <CardDescription>{post.excerpt}</CardDescription>}
                        </CardHeader>
                        <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                          {post.author_name && <span>{post.author_name}</span>}
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(post.published_at).toLocaleDateString()}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Popular Posts</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {popular.length === 0 && <p className="text-sm text-muted-foreground">No posts yet.</p>}
                  {popular.map((p) => (
                    <Link key={p.id} to={`/blog/${p.slug}`} className="block text-sm hover:text-gold transition-colors">
                      {p.title}
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
