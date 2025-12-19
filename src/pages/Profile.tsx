import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock, User, Mail, FileText, Tag, ArrowLeft, Save, LogOut } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  skills: z.string().max(500, "Skills must be less than 500 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  time_credits: number;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", bio: "", skills: "" },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
      } else if (data) {
        setProfile(data);
        form.reset({
          full_name: data.full_name || "",
          bio: data.bio || "",
          skills: data.skills?.join(", ") || "",
        });
      }
      setIsLoading(false);
    };

    if (user) {
      fetchProfile();
    }
  }, [user, form, toast]);

  const handleSave = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSaving(true);
    const skillsArray = data.skills
      ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        bio: data.bio || null,
        skills: skillsArray.length > 0 ? skillsArray : null,
      })
      .eq("user_id", user.id);

    setIsSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Profile updated successfully" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center animate-pulse">
          <Clock className="w-6 h-6 text-navy" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="max-w-2xl mx-auto relative z-10 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          
          <a href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <Clock className="w-5 h-5 text-navy" />
            </div>
            <span className="text-xl font-serif font-bold text-foreground">
              Time<span className="text-gold">Bank</span>
            </span>
          </a>
        </div>

        {/* Profile Card */}
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center">
              <User className="w-10 h-10 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold">{profile?.full_name || "Your Profile"}</h1>
              <p className="text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4 text-gold" />
                <span className="text-gold font-semibold">{profile?.time_credits || 0} Time Credits</span>
              </div>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="full_name"
                placeholder="Your full name"
                {...form.register("full_name")}
              />
              {form.formState.errors.full_name && (
                <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and the services you offer..."
                rows={4}
                {...form.register("bio")}
              />
              {form.formState.errors.bio && (
                <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Skills (comma-separated)
              </Label>
              <Input
                id="skills"
                placeholder="e.g., Web Design, Tutoring, Gardening"
                {...form.register("skills")}
              />
              {form.formState.errors.skills && (
                <p className="text-sm text-destructive">{form.formState.errors.skills.message}</p>
              )}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-gold/10 text-gold text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="gold" disabled={isSaving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="glass-card p-6 rounded-2xl mt-6">
          <h2 className="font-serif font-bold text-lg mb-4">Account Information</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
            <p>Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
