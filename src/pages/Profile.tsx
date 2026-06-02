import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useProfileData } from "@/hooks/useProfileData";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileAbout } from "@/components/profile/ProfileAbout";
import { ProfileExperience } from "@/components/profile/ProfileExperience";
import { ProfileEducation } from "@/components/profile/ProfileEducation";
import { ProfileSkills } from "@/components/profile/ProfileSkills";
import { ProfileCertifications } from "@/components/profile/ProfileCertifications";
import { ProfilePortfolio } from "@/components/profile/ProfilePortfolio";
import { ProfileToolsLanguages } from "@/components/profile/ProfileToolsLanguages";
import { ProfileReviews } from "@/components/profile/ProfileReviews";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { ProfileCompleteness } from "@/components/profile/ProfileCompleteness";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, LogOut, UserX } from "lucide-react";
import MessagingDialog from "@/components/MessagingDialog";

type PrivacyStatus = "accessible" | "members_only" | "not_found";

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>("accessible");

  // Determine which profile to show
  useEffect(() => {
    const determineProfile = async () => {
      if (slug) {
        // Viewing someone else's profile by slug or user_id
        // RLS will filter based on privacy settings
        const { data, error } = await supabase
          .from("profiles_public")
          .select("user_id, profile_visibility")
          .or(`profile_slug.eq.${slug},user_id.eq.${slug}`)
          .maybeSingle();

        if (data) {
          setProfileUserId(data.user_id);
          setIsOwnProfile(user?.id === data.user_id);
          setPrivacyStatus("accessible");
        } else {
          // Profile not found - could be private or doesn't exist
          // Check if it's a privacy restriction by trying to see if the slug exists at all
          // For private profiles, RLS will hide them, so we show appropriate message
          setPrivacyStatus("not_found");
        }
      } else if (user) {
        // Viewing own profile
        setProfileUserId(user.id);
        setIsOwnProfile(true);
        setPrivacyStatus("accessible");
      }
    };

    if (!authLoading) {
      determineProfile();
    }
  }, [slug, user, authLoading, navigate]);

  // Redirect to auth if viewing own profile and not logged in
  useEffect(() => {
    if (!authLoading && !user && !slug) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate, slug]);

  const {
    profile,
    categories,
    skills,
    tools,
    experience,
    education,
    certifications,
    languages,
    portfolio,
    reviews,
    recommendations,
    metrics,
    isLoading,
    isFollowing,
    toggleFollow,
    checkFollowing,
    refreshAll,
    refetch,
  } = useProfileData(profileUserId, isOwnProfile);

  // Check following status when viewing other's profile
  useEffect(() => {
    if (user && profileUserId && user.id !== profileUserId) {
      checkFollowing(user.id);
    }
  }, [user, profileUserId, checkFollowing]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleToggleFollow = () => {
    if (user) {
      toggleFollow(user.id);
    }
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

  // Handle privacy-restricted profiles (members only when not logged in)
  if (privacyStatus === "not_found" && slug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <UserX className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-serif font-bold mb-2">
            Profile Not Available
          </h2>
          <p className="text-muted-foreground mb-6">
            {user 
              ? "This profile could not be found."
              : "This profile is only visible to logged-in members. Please sign in to view this profile."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            {!user && (
              <Button variant="gold" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10">
        {/* Top Navigation */}
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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

            {isOwnProfile && (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>

        {/* Main Profile Content */}
        <div className="max-w-5xl mx-auto px-4 pb-12">
          {/* Profile Header Card */}
          <div className="glass-card rounded-2xl overflow-hidden mb-6">
            <ProfileHeader
              profile={profile}
              categories={categories}
              metrics={metrics}
              isOwnProfile={isOwnProfile}
              isFollowing={isFollowing}
              onToggleFollow={handleToggleFollow}
              onEdit={() => setIsEditOpen(true)}
              onMessage={!isOwnProfile ? () => setMessagingOpen(true) : undefined}
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Sidebar */}
            <div className="space-y-6">
              {/* Profile Completeness - Only show for own profile */}
              {isOwnProfile && (
                <ProfileCompleteness
                  profile={profile}
                  categories={categories}
                  skills={skills}
                  experience={experience}
                  education={education}
                  portfolio={portfolio}
                />
              )}

              {/* About Section */}
              <ProfileAbout
                profile={profile}
                isOwnProfile={isOwnProfile}
                onUpdate={refetch.profile}
              />

              {/* Tools & Languages */}
              <div className="space-y-6">
                <ProfileToolsLanguages
                  tools={tools}
                  languages={languages}
                  isOwnProfile={isOwnProfile}
                  userId={profileUserId || ""}
                  onUpdate={() => {
                    refetch.tools();
                    refetch.languages();
                  }}
                />
              </div>
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skills */}
              <ProfileSkills
                skills={skills}
                isOwnProfile={isOwnProfile}
                userId={profileUserId || ""}
                currentUserId={user?.id}
                onUpdate={refetch.skills}
              />

              {/* Experience */}
              <ProfileExperience
                experience={experience}
                isOwnProfile={isOwnProfile}
                userId={profileUserId || ""}
                onUpdate={refetch.experience}
              />

              {/* Education */}
              <ProfileEducation
                education={education}
                isOwnProfile={isOwnProfile}
                userId={profileUserId || ""}
                onUpdate={refetch.education}
              />

              {/* Certifications */}
              <ProfileCertifications
                certifications={certifications}
                isOwnProfile={isOwnProfile}
                userId={profileUserId || ""}
                onUpdate={refetch.certifications}
              />

              {/* Portfolio */}
              <ProfilePortfolio
                portfolio={portfolio}
                isOwnProfile={isOwnProfile}
                userId={profileUserId || ""}
                onUpdate={refetch.portfolio}
              />

              {/* Reviews & Recommendations */}
              <ProfileReviews
                reviews={reviews}
                recommendations={recommendations}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <ProfileEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        profile={profile}
        categories={categories}
        userId={profileUserId || ""}
        onUpdate={refreshAll}
      />

      {/* Messaging Dialog */}
      {profile && !isOwnProfile && (
        <MessagingDialog
          open={messagingOpen}
          onOpenChange={setMessagingOpen}
          receiverId={profile.user_id}
          receiverName={profile.full_name || "User"}
        />
      )}
    </div>
  );
};

export default Profile;
