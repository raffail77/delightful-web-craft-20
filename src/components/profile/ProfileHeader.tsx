import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Camera, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Edit2, 
  UserPlus, 
  UserCheck,
  Share2,
  MessageCircle,
  Link as LinkIcon
} from 'lucide-react';
import type { Profile, ProfileMetrics, UserCategory } from '@/types/profile';
import { CATEGORY_LABELS } from '@/types/profile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileHeaderProps {
  profile: Profile | null;
  categories: UserCategory[];
  metrics: ProfileMetrics | null;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onEdit: () => void;
  onMessage?: () => void;
}

const AVAILABILITY_COLORS: Record<string, string> = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  unavailable: 'bg-red-500',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available for work',
  busy: 'Limited availability',
  unavailable: 'Not available',
};

export const ProfileHeader = ({
  profile,
  categories,
  metrics,
  isOwnProfile,
  isFollowing,
  onToggleFollow,
  onEdit,
  onMessage,
}: ProfileHeaderProps) => {
  const { toast } = useToast();
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const handleCoverSave = async () => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ cover_url: coverUrl })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update cover image', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Cover image updated' });
      setIsEditingCover(false);
    }
  };

  const handleAvatarSave = async () => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile photo', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Profile photo updated' });
      setIsEditingAvatar(false);
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.profile_slug || profile?.user_id}`;
    await navigator.clipboard.writeText(profileUrl);
    toast({ title: 'Copied!', description: 'Profile link copied to clipboard' });
  };

  const availability = profile?.availability_status || 'available';

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-navy to-navy-light rounded-t-2xl overflow-hidden">
        {profile?.cover_url && (
          <img 
            src={profile.cover_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
        {!profile?.cover_url && (
          <div className="absolute inset-0 bg-gradient-navy opacity-90" />
        )}
        
        {isOwnProfile && (
          <div className="absolute top-4 right-4">
            {isEditingCover ? (
              <div className="flex gap-2 items-center bg-background/90 backdrop-blur p-2 rounded-lg">
                <Input
                  placeholder="Enter cover image URL"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-64"
                />
                <Button size="sm" onClick={handleCoverSave}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingCover(false)}>Cancel</Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsEditingCover(true)}
                className="bg-background/80 backdrop-blur"
              >
                <Camera className="w-4 h-4 mr-2" />
                Edit Cover
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="absolute -top-16 left-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-background bg-gradient-gold flex items-center justify-center overflow-hidden shadow-elevated">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'Profile'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-navy">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            
            {/* Verification Badge */}
            {profile?.is_verified && (
              <div className="absolute bottom-2 right-2 bg-background rounded-full p-1">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
            )}
            
            {/* Edit Avatar Button */}
            {isOwnProfile && (
              <button
                onClick={() => setIsEditingAvatar(true)}
                className="absolute bottom-0 right-0 bg-gold text-navy rounded-full p-2 shadow-md hover:scale-110 transition-transform"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {isEditingAvatar && (
            <div className="absolute top-full mt-2 left-0 flex gap-2 items-center bg-background/95 backdrop-blur p-3 rounded-lg shadow-elevated z-10">
              <Input
                placeholder="Enter avatar URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-64"
              />
              <Button size="sm" onClick={handleAvatarSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingAvatar(false)}>Cancel</Button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-4 gap-2">
          {isOwnProfile ? (
            <Button onClick={onEdit} variant="outline">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                onClick={onToggleFollow}
                variant={isFollowing ? 'outline' : 'gold'}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
              {onMessage && (
                <Button onClick={onMessage} variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Name and Headline */}
        <div className="mt-12 md:mt-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-serif font-bold">
              {profile?.full_name || 'Anonymous User'}
            </h1>
            
            {/* Availability Status */}
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${AVAILABILITY_COLORS[availability]}`} />
              <span className="text-sm text-muted-foreground">
                {AVAILABILITY_LABELS[availability]}
              </span>
            </div>
          </div>
          
          {profile?.headline && (
            <p className="text-lg text-muted-foreground mt-1">{profile.headline}</p>
          )}

          {/* Location and Response Time */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            {profile?.location && profile.show_location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </span>
            )}
            {profile?.response_time_hours && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Responds within {profile.response_time_hours}h
              </span>
            )}
            {profile?.profile_slug && (
              <span className="flex items-center gap-1 text-gold">
                <LinkIcon className="w-4 h-4" />
                timebank.app/{profile.profile_slug}
              </span>
            )}
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                  {cat.category === 'other' ? cat.custom_category : CATEGORY_LABELS[cat.category]}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          {metrics && (
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">{metrics.completedContracts}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Rating ({metrics.totalReviews})</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{profile?.time_credits || 0}</p>
                <p className="text-xs text-muted-foreground">Credits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.followersCount}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.servicesOffered + metrics.servicesRequested}</p>
                <p className="text-xs text-muted-foreground">Services</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
