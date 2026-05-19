import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface LegalPageProps {
  slug: "privacy" | "terms" | "cookies";
}

// Minimal markdown-ish renderer: # / ## / lists / paragraphs
const renderContent = (content: string) => {
  const lines = content.split("\n");
  const nodes: JSX.Element[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: number) => {
    if (listBuffer.length) {
      nodes.push(
        <ul key={`ul-${key}`} className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
          {listBuffer.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    if (line.startsWith("# ")) {
      flushList(idx);
      // Skip - title rendered separately
    } else if (line.startsWith("## ")) {
      flushList(idx);
      nodes.push(<h2 key={idx} className="text-2xl font-serif font-bold mb-4 mt-8">{line.slice(3)}</h2>);
    } else if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
    } else if (line.trim()) {
      flushList(idx);
      nodes.push(<p key={idx} className="text-muted-foreground leading-relaxed mb-4">{line}</p>);
    } else {
      flushList(idx);
    }
  });
  flushList(lines.length);
  return nodes;
};

const LegalPage = ({ slug }: LegalPageProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["legal", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <Skeleton className="h-96" />
            ) : !data ? (
              <p className="text-muted-foreground">Document not found.</p>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
                  {data.title}
                </h1>
                <p className="text-muted-foreground mb-8">
                  Version {data.version} · Last updated {new Date(data.updated_at).toLocaleDateString()}
                </p>
                <div>{renderContent(data.content)}</div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
