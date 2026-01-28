import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ThumbsUp, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserSkill, ProfessionalCategory } from '@/types/profile';
import { CATEGORY_LABELS } from '@/types/profile';

interface ProfileSkillsProps {
  skills: UserSkill[];
  isOwnProfile: boolean;
  userId: string;
  currentUserId?: string;
  onUpdate: () => void;
}

const PROFICIENCY_LABELS = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

export const ProfileSkills = ({ 
  skills, 
  isOwnProfile, 
  userId,
  currentUserId,
  onUpdate 
}: ProfileSkillsProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    skill_name: '',
    proficiency_level: 3,
    category: '' as ProfessionalCategory | '',
  });
  const [endorsedSkills, setEndorsedSkills] = useState<Set<string>>(new Set());

  const handleSave = async () => {
    if (!form.skill_name) {
      toast({ title: 'Error', description: 'Please enter a skill name', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('user_skills').insert({
      user_id: userId,
      skill_name: form.skill_name,
      proficiency_level: form.proficiency_level,
      category: form.category || null,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Error', description: 'This skill already exists', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to add skill', variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Success', description: 'Skill added' });
    setForm({ skill_name: '', proficiency_level: 3, category: '' });
    setIsOpen(false);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('user_skills').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete skill', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Skill removed' });
      onUpdate();
    }
  };

  const handleEndorse = async (skillId: string) => {
    if (!currentUserId || currentUserId === userId) return;

    const { error } = await supabase.from('endorsements').insert({
      endorser_id: currentUserId,
      skill_id: skillId,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already endorsed', description: 'You have already endorsed this skill' });
      } else {
        toast({ title: 'Error', description: 'Failed to endorse skill', variant: 'destructive' });
      }
      return;
    }

    setEndorsedSkills((prev) => new Set([...prev, skillId]));
    toast({ title: 'Endorsed!', description: 'Your endorsement has been added' });
    onUpdate();
  };

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          Skills
        </h2>
        {isOwnProfile && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Skill</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="skill_name">Skill Name *</Label>
                  <Input
                    id="skill_name"
                    value={form.skill_name}
                    onChange={(e) => setForm({ ...form, skill_name: e.target.value })}
                    placeholder="e.g. React, Project Management"
                  />
                </div>
                <div>
                  <Label>Proficiency Level: {PROFICIENCY_LABELS[form.proficiency_level - 1]}</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setForm({ ...form, proficiency_level: level })}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          form.proficiency_level >= level
                            ? 'bg-gold border-gold text-navy'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Category (Optional)</Label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => setForm({ ...form, category: val as ProfessionalCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full">
                  Add Skill
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {skills.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          {isOwnProfile ? 'Add your skills to showcase your expertise.' : 'No skills listed.'}
        </p>
      ) : (
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{skill.skill_name}</span>
                  {skill.category && (
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[skill.category]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isOwnProfile && currentUserId && currentUserId !== userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEndorse(skill.id)}
                      disabled={endorsedSkills.has(skill.id)}
                      className="text-xs"
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {skill.endorsement_count}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => handleDelete(skill.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  {isOwnProfile && (
                    <span className="text-xs text-muted-foreground">
                      {skill.endorsement_count} endorsements
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={skill.proficiency_level * 20} className="h-2" />
                <span className="text-xs text-muted-foreground w-20">
                  {PROFICIENCY_LABELS[skill.proficiency_level - 1]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
