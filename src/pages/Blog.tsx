import { Calendar, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const posts = [
  {
    title: "Getting Started with Time Banking: A Complete Guide",
    excerpt: "Learn the basics of time banking and how to make the most of your skills on our platform.",
    author: "Sarah Ahmed",
    date: "Dec 20, 2024",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400",
  },
  {
    title: "5 Most In-Demand Skills on TimeBank",
    excerpt: "Discover which skills are most requested and how you can leverage yours.",
    author: "Ali Hassan",
    date: "Dec 15, 2024",
    category: "Insights",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400",
  },
  {
    title: "How Local Businesses Are Thriving with Time Exchange",
    excerpt: "Real stories from business owners who have grown using TimeBank.",
    author: "Fatima Khan",
    date: "Dec 10, 2024",
    category: "Case Study",
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400",
  },
  {
    title: "The Future of Work: Beyond Traditional Currency",
    excerpt: "Exploring how time-based economies are reshaping the way we think about value.",
    author: "Omar Malik",
    date: "Dec 5, 2024",
    category: "Thought Leadership",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              TimeBank <span className="text-gold">Blog</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Insights, guides, and stories from the TimeBank community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {posts.map((post) => (
              <Card key={post.title} className="overflow-hidden hover:border-gold transition-colors cursor-pointer">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                  <CardTitle className="text-xl leading-tight">{post.title}</CardTitle>
                  <CardDescription>{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
