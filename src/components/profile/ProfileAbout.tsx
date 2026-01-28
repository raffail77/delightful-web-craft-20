import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/types/profile';

interface ProfileAboutProps {
  profile: Profile | null;
  isOwnProfile: boolean;
  onUpdate: () => void;
}

export const ProfileAbout = ({ profile, isOwnProfile, onUpdate }: ProfileAboutProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [about, setAbout] = useState(profile?.about || profile?.bio || '');

  const handleSave = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ about })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update about section', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'About section updated' });
      setIsEditing(false);
      onUpdate();
    }
  };

  const displayText = profile?.about || profile?.bio;

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold">About</h2>
        {isOwnProfile && !isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <Textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Tell others about yourself, your expertise, and what you offer..."
            rows={6}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {displayText ? (
            <p className="text-muted-foreground whitespace-pre-wrap">{displayText}</p>
          ) : (
            <p className="text-muted-foreground italic">
              {isOwnProfile 
                ? 'Add a description about yourself and your professional experience...' 
                : 'No description provided.'
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
};
