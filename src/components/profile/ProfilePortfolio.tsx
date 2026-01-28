import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, FolderOpen, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PortfolioItem } from '@/types/profile';

interface ProfilePortfolioProps {
  portfolio: PortfolioItem[];
  isOwnProfile: boolean;
  userId: string;
  onUpdate: () => void;
}

export const ProfilePortfolio = ({ 
  portfolio, 
  isOwnProfile, 
  userId,
  onUpdate 
}: ProfilePortfolioProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    project_url: '',
    image_url: '',
    tags: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      project_url: '',
      image_url: '',
      tags: '',
    });
    setEditingId(null);
  };

  const handleEdit = (item: PortfolioItem) => {
    setForm({
      title: item.title,
      description: item.description || '',
      project_url: item.project_url || '',
      image_url: item.image_url || '',
      tags: item.tags?.join(', ') || '',
    });
    setEditingId(item.id);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      toast({ title: 'Error', description: 'Please enter a title', variant: 'destructive' });
      return;
    }

    const tagsArray = form.tags
      ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : null;

    const payload = {
      user_id: userId,
      title: form.title,
      description: form.description || null,
      project_url: form.project_url || null,
      image_url: form.image_url || null,
      tags: tagsArray,
    };

    if (editingId) {
      const { error } = await supabase
        .from('portfolio_items')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update portfolio item', variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase.from('portfolio_items').insert(payload);

      if (error) {
        toast({ title: 'Error', description: 'Failed to add portfolio item', variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Success', description: editingId ? 'Portfolio updated' : 'Portfolio item added' });
    resetForm();
    setIsOpen(false);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('portfolio_items').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete portfolio item', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Portfolio item removed' });
      onUpdate();
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-gold" />
          Portfolio
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
                <DialogTitle>{editingId ? 'Edit' : 'Add'} Portfolio Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. E-commerce Website Redesign"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the project..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="project_url">Project URL</Label>
                  <Input
                    id="project_url"
                    value={form.project_url}
                    onChange={(e) => setForm({ ...form, project_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="e.g. React, UI/UX, E-commerce"
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingId ? 'Update' : 'Add'} Portfolio Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {portfolio.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          {isOwnProfile ? 'Showcase your best work by adding portfolio items.' : 'No portfolio items.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolio.map((item) => (
            <div key={item.id} className="relative group border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              {item.image_url ? (
                <AspectRatio ratio={16 / 9}>
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
              ) : (
                <AspectRatio ratio={16 / 9}>
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <FolderOpen className="w-12 h-12 text-muted-foreground" />
                  </div>
                </AspectRatio>
              )}
              <div className="p-4">
                <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {item.description}
                  </p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {item.project_url && (
                  <a
                    href={item.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    View Project <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              {isOwnProfile && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
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
