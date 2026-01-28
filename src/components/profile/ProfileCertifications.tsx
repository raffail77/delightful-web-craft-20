import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Award, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Certification } from '@/types/profile';
import { format } from 'date-fns';

interface ProfileCertificationsProps {
  certifications: Certification[];
  isOwnProfile: boolean;
  userId: string;
  onUpdate: () => void;
}

export const ProfileCertifications = ({ 
  certifications, 
  isOwnProfile, 
  userId,
  onUpdate 
}: ProfileCertificationsProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiry_date: '',
      credential_id: '',
      credential_url: '',
    });
    setEditingId(null);
  };

  const handleEdit = (cert: Certification) => {
    setForm({
      name: cert.name,
      issuing_organization: cert.issuing_organization,
      issue_date: cert.issue_date || '',
      expiry_date: cert.expiry_date || '',
      credential_id: cert.credential_id || '',
      credential_url: cert.credential_url || '',
    });
    setEditingId(cert.id);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.issuing_organization) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    const payload = {
      user_id: userId,
      name: form.name,
      issuing_organization: form.issuing_organization,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      credential_id: form.credential_id || null,
      credential_url: form.credential_url || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('certifications')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update certification', variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase.from('certifications').insert(payload);

      if (error) {
        toast({ title: 'Error', description: 'Failed to add certification', variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Success', description: editingId ? 'Certification updated' : 'Certification added' });
    resetForm();
    setIsOpen(false);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('certifications').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete certification', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Certification removed' });
      onUpdate();
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
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
          <Award className="w-5 h-5 text-gold" />
          Licenses & Certifications
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
                <DialogTitle>{editingId ? 'Edit' : 'Add'} Certification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Certification Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. AWS Solutions Architect"
                  />
                </div>
                <div>
                  <Label htmlFor="issuing_organization">Issuing Organization *</Label>
                  <Input
                    id="issuing_organization"
                    value={form.issuing_organization}
                    onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })}
                    placeholder="e.g. Amazon Web Services"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issue_date">Issue Date</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={form.issue_date}
                      onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={form.expiry_date}
                      onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="credential_id">Credential ID</Label>
                  <Input
                    id="credential_id"
                    value={form.credential_id}
                    onChange={(e) => setForm({ ...form, credential_id: e.target.value })}
                    placeholder="e.g. ABC123XYZ"
                  />
                </div>
                <div>
                  <Label htmlFor="credential_url">Credential URL</Label>
                  <Input
                    id="credential_url"
                    value={form.credential_url}
                    onChange={(e) => setForm({ ...form, credential_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingId ? 'Update' : 'Add'} Certification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {certifications.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          {isOwnProfile ? 'Add your certifications and licenses.' : 'No certifications listed.'}
        </p>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => (
            <div key={cert.id} className="relative group flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{cert.name}</h3>
                <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                {cert.issue_date && (
                  <p className="text-xs text-muted-foreground">
                    Issued {formatDate(cert.issue_date)}
                    {cert.expiry_date && ` · Expires ${formatDate(cert.expiry_date)}`}
                  </p>
                )}
                {cert.credential_id && (
                  <p className="text-xs text-muted-foreground">
                    Credential ID: {cert.credential_id}
                  </p>
                )}
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    Show credential <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              {isOwnProfile && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cert)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cert.id)}>
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
