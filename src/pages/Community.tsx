import { Calendar, MessageSquare, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const stats = [
  { value: "50K+", label: "Community Members" },
  { value: "200K+", label: "Hours Exchanged" },
  { value: "15K+", label: "Services Offered" },
  { value: "98%", label: "Satisfaction Rate" },
];

const events = [
  {
    title: "Monthly Skill Share Meetup",
    date: "Jan 15, 2025",
    type: "Virtual",
    description: "Join us for our monthly virtual meetup to share skills and connect.",
  },
  {
    title: "TimeBank Workshop: Maximizing Your Credits",
    date: "Jan 22, 2025",
    type: "Virtual",
    description: "Learn tips and strategies to make the most of the platform.",
  },
  {
    title: "Lahore Community Gathering",
    date: "Feb 1, 2025",
    type: "In-Person",
    description: "Meet fellow TimeBank members in Lahore for networking and fun.",
  },
];

const Community = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Our <span className="text-gold">Community</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join a thriving community of skill sharers, entrepreneurs, and changemakers.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-card border border-border">
                <p className="text-3xl md:text-4xl font-bold text-gold mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Community Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardHeader>
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gold" />
                <CardTitle>Discussion Forums</CardTitle>
                <CardDescription>
                  Connect with members, ask questions, and share experiences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Join Discussions</Button>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Trophy className="w-12 h-12 mx-auto mb-4 text-gold" />
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>
                  See top contributors and most active community members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">View Leaderboard</Button>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 mx-auto mb-4 text-gold" />
                <CardTitle>Local Groups</CardTitle>
                <CardDescription>
                  Find and join TimeBank groups in your area.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Find Groups</Button>
              </CardContent>
            </Card>
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold">Upcoming Events</h2>
              <Button variant="link" className="text-gold">View All Events</Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.title}>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                      <span className="ml-auto px-2 py-1 rounded bg-gold/10 text-gold text-xs">
                        {event.type}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-gold hover:bg-gold/90 text-navy">
                      Register
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Community;
