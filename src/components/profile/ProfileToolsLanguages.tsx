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
import { Plus, Trash2, Wrench, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserTool, UserLanguage } from '@/types/profile';

interface ProfileToolsLanguagesProps {
  tools: UserTool[];
  languages: UserLanguage[];
  isOwnProfile: boolean;
  userId: string;
  onUpdate: () => void;
}

const PROFICIENCY_LABELS = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
const LANGUAGE_PROFICIENCY = ['Elementary', 'Conversational', 'Professional', 'Native/Bilingual'];

export const ProfileToolsLanguages = ({ 
  tools, 
  languages,
  isOwnProfile, 
  userId,
  onUpdate 
}: ProfileToolsLanguagesProps) => {
  const { toast } = useToast();
  const [isToolOpen, setIsToolOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [toolForm, setToolForm] = useState({ tool_name: '', proficiency_level: 3 });
  const [langForm, setLangForm] = useState({ language: '', proficiency: 'conversational' });

  const handleAddTool = async () => {
    if (!toolForm.tool_name) {
      toast({ title: 'Error', description: 'Please enter a tool name', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('user_tools').insert({
      user_id: userId,
      tool_name: toolForm.tool_name,
      proficiency_level: toolForm.proficiency_level,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Error', description: 'This tool already exists', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to add tool', variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Success', description: 'Tool added' });
    setToolForm({ tool_name: '', proficiency_level: 3 });
    setIsToolOpen(false);
    onUpdate();
  };

  const handleDeleteTool = async (id: string) => {
    const { error } = await supabase.from('user_tools').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete tool', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Tool removed' });
      onUpdate();
    }
  };

  const handleAddLanguage = async () => {
    if (!langForm.language) {
      toast({ title: 'Error', description: 'Please enter a language', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('user_languages').insert({
      user_id: userId,
      language: langForm.language,
      proficiency: langForm.proficiency,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Error', description: 'This language already exists', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to add language', variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Success', description: 'Language added' });
    setLangForm({ language: '', proficiency: 'conversational' });
    setIsLangOpen(false);
    onUpdate();
  };

  const handleDeleteLanguage = async (id: string) => {
    const { error } = await supabase.from('user_languages').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete language', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Language removed' });
      onUpdate();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tools Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-gold" />
            Tools & Technologies
          </h2>
          {isOwnProfile && (
            <Dialog open={isToolOpen} onOpenChange={setIsToolOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tool</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="tool_name">Tool Name *</Label>
                    <Input
                      id="tool_name"
                      value={toolForm.tool_name}
                      onChange={(e) => setToolForm({ ...toolForm, tool_name: e.target.value })}
                      placeholder="e.g. Figma, VS Code, Docker"
                    />
                  </div>
                  <div>
                    <Label>Proficiency: {PROFICIENCY_LABELS[toolForm.proficiency_level - 1]}</Label>
                    <div className="flex gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setToolForm({ ...toolForm, proficiency_level: level })}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            toolForm.proficiency_level >= level
                              ? 'bg-gold border-gold text-navy'
                              : 'border-border hover:border-gold/50'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAddTool} className="w-full">
                    Add Tool
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {tools.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            {isOwnProfile ? 'Add the tools you use.' : 'No tools listed.'}
          </p>
        ) : (
          <div className="space-y-3">
            {tools.map((tool) => (
              <div key={tool.id} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{tool.tool_name}</span>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => handleDeleteTool(tool.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Progress value={tool.proficiency_level * 20} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Languages Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-gold" />
            Languages
          </h2>
          {isOwnProfile && (
            <Dialog open={isLangOpen} onOpenChange={setIsLangOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Language</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="language">Language *</Label>
                    <Input
                      id="language"
                      value={langForm.language}
                      onChange={(e) => setLangForm({ ...langForm, language: e.target.value })}
                      placeholder="e.g. English, Spanish"
                    />
                  </div>
                  <div>
                    <Label>Proficiency</Label>
                    <Select
                      value={langForm.proficiency}
                      onValueChange={(val) => setLangForm({ ...langForm, proficiency: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_PROFICIENCY.map((level) => (
                          <SelectItem key={level.toLowerCase()} value={level.toLowerCase()}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddLanguage} className="w-full">
                    Add Language
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {languages.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            {isOwnProfile ? 'Add languages you speak.' : 'No languages listed.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <Badge
                key={lang.id}
                variant="secondary"
                className="group relative pr-8"
              >
                {lang.language}
                <span className="text-xs opacity-70 ml-1">
                  ({lang.proficiency})
                </span>
                {isOwnProfile && (
                  <button
                    onClick={() => handleDeleteLanguage(lang.id)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
