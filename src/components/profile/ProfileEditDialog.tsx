import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Profile, UserCategory, ProfessionalCategory } from '@/types/profile';
import { CATEGORY_LABELS } from '@/types/profile';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  categories: UserCategory[];
  userId: string;
  onUpdate: () => void;
}

export const ProfileEditDialog = ({
  open,
  onOpenChange,
  profile,
  categories,
  userId,
  onUpdate,
}: ProfileEditDialogProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    headline: profile?.headline || '',
    location: profile?.location || '',
    availability_status: profile?.availability_status || 'available',
    about: profile?.about || profile?.bio || '',
    response_time_hours: profile?.response_time_hours?.toString() || '',
    show_email: profile?.show_email || false,
    show_location: profile?.show_location ?? true,
    profile_visibility: profile?.profile_visibility || 'public',
  });
  const [selectedCategories, setSelectedCategories] = useState<ProfessionalCategory[]>(
    categories.map((c) => c.category)
  );
  const [customCategory, setCustomCategory] = useState(
    categories.find((c) => c.category === 'other')?.custom_category || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        headline: form.headline || null,
        location: form.location || null,
        availability_status: form.availability_status,
        about: form.about || null,
        response_time_hours: form.response_time_hours ? parseInt(form.response_time_hours) : null,
        show_email: form.show_email,
        show_location: form.show_location,
        profile_visibility: form.profile_visibility,
      })
      .eq('user_id', userId);

    if (profileError) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
      setIsSaving(false);
      return;
    }

    // Update categories
    // First delete all existing
    await supabase.from('user_categories').delete().eq('user_id', userId);

    // Then insert new ones
    if (selectedCategories.length > 0) {
      const categoryInserts = selectedCategories.map((cat) => ({
        user_id: userId,
        category: cat,
        custom_category: cat === 'other' ? customCategory : null,
      }));

      const { error: catError } = await supabase.from('user_categories').insert(categoryInserts);

      if (catError) {
        toast({ title: 'Warning', description: 'Profile saved but categories may not have updated', variant: 'destructive' });
      }
    }

    toast({ title: 'Success', description: 'Profile updated successfully' });
    setIsSaving(false);
    onOpenChange(false);
    onUpdate();
  };

  const toggleCategory = (cat: ProfessionalCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="headline">Professional Headline</Label>
            <Input
              id="headline"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. Senior Full-Stack Developer | React & Node.js Expert"
            />
          </div>

          <div>
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              placeholder="Tell others about yourself, your expertise, and what services you offer..."
              rows={5}
            />
          </div>

          {/* Professional Categories */}
          <div>
            <Label className="mb-3 block">Professional Categories</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(CATEGORY_LABELS) as ProfessionalCategory[]).map((cat) => (
                <div key={cat} className="flex items-center space-x-2">
                  <Checkbox
                    id={cat}
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <label
                    htmlFor={cat}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {CATEGORY_LABELS[cat]}
                  </label>
                </div>
              ))}
            </div>
            {selectedCategories.includes('other') && (
              <div className="mt-3">
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Specify your category"
                />
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Availability Status</Label>
              <Select
                value={form.availability_status}
                onValueChange={(val) => setForm({ ...form, availability_status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available for work</SelectItem>
                  <SelectItem value="busy">Limited availability</SelectItem>
                  <SelectItem value="unavailable">Not available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="response_time">Response Time (hours)</Label>
              <Input
                id="response_time"
                type="number"
                value={form.response_time_hours}
                onChange={(e) => setForm({ ...form, response_time_hours: e.target.value })}
                placeholder="e.g. 24"
              />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Privacy Settings</Label>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Show Email</p>
                <p className="text-xs text-muted-foreground">Allow others to see your email address</p>
              </div>
              <Switch
                checked={form.show_email}
                onCheckedChange={(checked) => setForm({ ...form, show_email: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Show Location</p>
                <p className="text-xs text-muted-foreground">Display your location on your profile</p>
              </div>
              <Switch
                checked={form.show_location}
                onCheckedChange={(checked) => setForm({ ...form, show_location: checked })}
              />
            </div>
            <div>
              <Label>Profile Visibility</Label>
              <Select
                value={form.profile_visibility}
                onValueChange={(val) => setForm({ ...form, profile_visibility: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Visible to everyone</SelectItem>
                  <SelectItem value="members">Members only - Visible to logged-in users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
