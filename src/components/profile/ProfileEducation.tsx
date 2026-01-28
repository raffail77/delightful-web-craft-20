import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Education } from '@/types/profile';
import { format } from 'date-fns';

interface ProfileEducationProps {
  education: Education[];
  isOwnProfile: boolean;
  userId: string;
  onUpdate: () => void;
}

export const ProfileEducation = ({ 
  education, 
  isOwnProfile, 
  userId,
  onUpdate 
}: ProfileEducationProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    grade: '',
    description: '',
  });

  const resetForm = () => {
    setForm({
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      grade: '',
      description: '',
    });
    setEditingId(null);
  };

  const handleEdit = (edu: Education) => {
    setForm({
      institution: edu.institution,
      degree: edu.degree,
      field_of_study: edu.field_of_study || '',
      start_date: edu.start_date || '',
      end_date: edu.end_date || '',
      grade: edu.grade || '',
      description: edu.description || '',
    });
    setEditingId(edu.id);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.institution || !form.degree) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    const payload = {
      user_id: userId,
      institution: form.institution,
      degree: form.degree,
      field_of_study: form.field_of_study || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      grade: form.grade || null,
      description: form.description || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('education')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update education', variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase.from('education').insert(payload);

      if (error) {
        toast({ title: 'Error', description: 'Failed to add education', variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Success', description: editingId ? 'Education updated' : 'Education added' });
    resetForm();
    setIsOpen(false);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('education').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete education', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Education removed' });
      onUpdate();
    }
  };

  const formatYear = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-gold" />
          Education
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
                <DialogTitle>{editingId ? 'Edit' : 'Add'} Education</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="institution">Institution *</Label>
                  <Input
                    id="institution"
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    placeholder="e.g. University of Technology"
                  />
                </div>
                <div>
                  <Label htmlFor="degree">Degree *</Label>
                  <Input
                    id="degree"
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    placeholder="e.g. Bachelor of Science"
                  />
                </div>
                <div>
                  <Label htmlFor="field_of_study">Field of Study</Label>
                  <Input
                    id="field_of_study"
                    value={form.field_of_study}
                    onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Year</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Year</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    placeholder="e.g. 3.8 GPA, First Class Honours"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Activities, societies, achievements..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingId ? 'Update' : 'Add'} Education
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {education.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          {isOwnProfile ? 'Add your education background.' : 'No education listed.'}
        </p>
      ) : (
        <div className="space-y-6">
          {education.map((edu) => (
            <div key={edu.id} className="relative group">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{edu.institution}</h3>
                  <p className="text-sm text-muted-foreground">
                    {edu.degree}{edu.field_of_study && `, ${edu.field_of_study}`}
                  </p>
                  {(edu.start_date || edu.end_date) && (
                    <p className="text-xs text-muted-foreground">
                      {formatYear(edu.start_date)} - {formatYear(edu.end_date) || 'Present'}
                    </p>
                  )}
                  {edu.grade && (
                    <p className="text-xs text-muted-foreground">Grade: {edu.grade}</p>
                  )}
                  {edu.description && (
                    <p className="text-sm mt-2 text-muted-foreground">{edu.description}</p>
                  )}
                </div>
              </div>
              {isOwnProfile && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(edu)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(edu.id)}>
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
