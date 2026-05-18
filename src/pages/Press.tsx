import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const Press = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["press-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,published_at,category")
        .eq("status", "published")
        .ilike("category", "press")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: mediaKit } = useQuery({
    queryKey: ["media-kit"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("value").eq("key", "media_kit").maybeSingle();
      return (data?.value as { url?: string; name?: string }) ?? null;
    },
  });

  const hasMediaKit = !!mediaKit?.url;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Press & <span className="text-gold">Media</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Latest news, press releases, and media resources about TimeBank.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-serif font-bold mb-6">Press Releases</h2>
              <div className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : posts.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">No press releases yet.</CardContent></Card>
                ) : (
                  posts.map((p) => (
                    <Card key={p.id}>
                      <CardHeader>
                        <CardDescription>{p.published_at ? new Date(p.published_at).toLocaleDateString() : ""}</CardDescription>
                        <CardTitle className="text-lg">{p.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {p.excerpt && <p className="text-muted-foreground mb-4">{p.excerpt}</p>}
                        <Link to={`/blog/${p.slug}`}>
                          <Button variant="link" className="p-0 text-gold">
                            Read More <ExternalLink className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-8 rounded-2xl bg-card border border-border">
                <h2 className="text-2xl font-serif font-bold mb-4">Media Kit</h2>
                <p className="text-muted-foreground mb-6">
                  Download our brand assets, logos, and company information.
                </p>
                {hasMediaKit ? (
                  <Button asChild className="bg-gold hover:bg-gold/90 text-navy">
                    <a href={mediaKit!.url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="w-4 h-4 mr-2" />
                      Download Media Kit
                    </a>
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block cursor-not-allowed">
                        <Button disabled className="pointer-events-none opacity-60">
                          <Download className="w-4 h-4 mr-2" />
                          Download Media Kit
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Media kit not available</TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="p-8 rounded-2xl bg-muted text-center">
                <h3 className="text-xl font-semibold mb-2">Media Inquiries</h3>
                <p className="text-muted-foreground mb-4">For press inquiries, please contact our communications team.</p>
                <Link to="/contact" className="text-gold hover:underline">Contact us</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Press;
