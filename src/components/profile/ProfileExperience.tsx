import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { WorkExperience } from '@/types/profile';
import { format } from 'date-fns';

interface ProfileExperienceProps {
  experience: WorkExperience[];
  isOwnProfile: boolean;
  userId: string;
  onUpdate: () => void;
}

export const ProfileExperience = ({ 
  experience, 
  isOwnProfile, 
  userId,
  onUpdate 
}: ProfileExperienceProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
    });
    setEditingId(null);
  };

  const handleEdit = (exp: WorkExperience) => {
    setForm({
      title: exp.title,
      company: exp.company,
      location: exp.location || '',
      start_date: exp.start_date,
      end_date: exp.end_date || '',
      is_current: exp.is_current,
      description: exp.description || '',
    });
    setEditingId(exp.id);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.company || !form.start_date) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    const payload = {
      user_id: userId,
      title: form.title,
      company: form.company,
      location: form.location || null,
      start_date: form.start_date,
      end_date: form.is_current ? null : (form.end_date || null),
      is_current: form.is_current,
      description: form.description || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('work_experience')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update experience', variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase.from('work_experience').insert(payload);

      if (error) {
        toast({ title: 'Error', description: 'Failed to add experience', variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Success', description: editingId ? 'Experience updated' : 'Experience added' });
    resetForm();
    setIsOpen(false);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('work_experience').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete experience', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Experience removed' });
      onUpdate();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-gold" />
          Experience
        </h2>
        {isOwnProfile && (
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit' : 'Add'} Experience</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Senior Developer"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Tech Corp"
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
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_current"
                    checked={form.is_current}
                    onCheckedChange={(checked) => setForm({ ...form, is_current: checked })}
                  />
                  <Label htmlFor="is_current">I currently work here</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>
                  {!form.is_current && (
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe your role and achievements..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingId ? 'Update' : 'Add'} Experience
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {experience.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          {isOwnProfile ? 'Add your work experience to showcase your background.' : 'No experience listed.'}
        </p>
      ) : (
        <div className="space-y-6">
          {experience.map((exp) => (
            <div key={exp.id} className="relative group">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{exp.title}</h3>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : (exp.end_date ? formatDate(exp.end_date) : 'Present')}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className="text-sm mt-2 text-muted-foreground">{exp.description}</p>
                  )}
                </div>
              </div>
              {isOwnProfile && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(exp)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(exp.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
