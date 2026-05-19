import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import { supabase } from "@/integrations/supabase/client";

const HelpCenter = () => {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["help-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_articles")
        .select("*")
        .eq("status", "published")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a: any) => a.category))),
    [articles]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return articles.filter((a: any) => {
      if (activeCat && a.category !== activeCat) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt?.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
      );
    });
  }, [articles, search, activeCat]);

  const onOpenArticle = (slug: string) => {
    supabase.rpc("increment_help_view", { p_slug: slug });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Help <span className="text-gold">Center</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers, guides, and support for all your TimeBank questions.
            </p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              <Badge
                variant={!activeCat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveCat(null)}
              >
                All
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={activeCat === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setActiveCat(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No articles found.</p>
            ) : (
              <Accordion type="single" collapsible className="space-y-2" onValueChange={(v) => {
                const article = filtered.find((a: any) => a.id === v);
                if (article) onOpenArticle(article.slug);
              }}>
                {filtered.map((article: any) => (
                  <AccordionItem key={article.id} value={article.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left">
                      <div>
                        <div>{article.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{article.category}</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                      {article.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;
