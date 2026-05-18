import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug!).eq("status", "published").maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["blog-related", post?.category, post?.id],
    queryFn: async () => {
      if (!post?.category) return [];
      const { data } = await supabase
        .from("blog_posts")
        .select("id,title,slug,thumbnail_url")
        .eq("status", "published")
        .eq("category", post.category)
        .neq("id", post.id)
        .limit(3);
      return data ?? [];
    },
    enabled: !!post,
  });

  useEffect(() => {
    if (slug) supabase.rpc("increment_blog_view", { p_slug: slug });
    if (post?.title) document.title = `${post.title} | TimeBank Blog`;
  }, [slug, post?.title]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to blog
          </Link>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : !post ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">Article not found.</CardContent></Card>
          ) : (
            <article>
              {post.category && <Badge variant="secondary" className="mb-4">{post.category}</Badge>}
              <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                {post.author_name && <span>By {post.author_name}</span>}
                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {post.thumbnail_url && (
                <img src={post.thumbnail_url} alt={post.title} className="w-full rounded-lg mb-8 object-cover max-h-96" />
              )}
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {post.content}
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8">
                  {post.tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              )}
            </article>
          )}

          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-serif font-bold mb-6">Related articles</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link key={r.id} to={`/blog/${r.slug}`}>
                    <Card className="overflow-hidden hover:border-gold transition-colors h-full">
                      {r.thumbnail_url && <img src={r.thumbnail_url} alt={r.title} className="w-full h-32 object-cover" />}
                      <CardHeader><CardTitle className="text-base">{r.title}</CardTitle></CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
