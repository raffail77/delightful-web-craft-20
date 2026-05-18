import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Briefcase, MapPin, DollarSign, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

const applySchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  cover_letter: z.string().trim().max(3000).optional().or(z.literal("")),
});

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  description: string;
  requirements: string | null;
  posted_at: string;
};

const formatSalary = (j: Job) => {
  if (!j.salary_min && !j.salary_max) return null;
  const c = j.salary_currency || "USD";
  if (j.salary_min && j.salary_max) return `${c} ${j.salary_min.toLocaleString()} – ${j.salary_max.toLocaleString()}`;
  return `${c} ${(j.salary_min || j.salary_max)?.toLocaleString()}`;
};

const Careers = () => {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [selected, setSelected] = useState<Job | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("posted_at", { ascending: false });
      if (error) throw error;
      return data as Job[];
    },
  });

  const departments = Array.from(new Set(jobs.map((j) => j.department))).sort();
  const types = Array.from(new Set(jobs.map((j) => j.employment_type))).sort();

  const filtered = jobs.filter((j) => {
    if (dept !== "all" && j.department !== dept) return false;
    if (type !== "all" && j.employment_type !== type) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${j.title} ${j.department} ${j.location} ${j.description}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Join Our <span className="text-gold">Team</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Help us build the future of skill and time exchange.
            </p>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-3 gap-3 max-w-4xl mx-auto mb-8">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Employment type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 max-w-3xl mx-auto">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-16 text-center text-muted-foreground">
                {jobs.length === 0 ? "No openings available right now. Check back soon!" : "No jobs match your filters."}
              </CardContent></Card>
            ) : (
              filtered.map((job) => (
                <Card key={job.id} className="hover:border-gold transition-colors cursor-pointer" onClick={() => setSelected(job)}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-4 mt-2">
                          <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.department}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                          {formatSalary(job) && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{formatSalary(job)}</span>}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{job.employment_type}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Detail dialog */}
      <Dialog open={!!selected && !applyOpen} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selected.title}</DialogTitle>
                <DialogDescription className="flex flex-wrap gap-3 pt-2">
                  <Badge variant="secondary">{selected.department}</Badge>
                  <Badge variant="outline">{selected.employment_type}</Badge>
                  <Badge variant="outline">{selected.location}</Badge>
                  {formatSalary(selected) && <Badge variant="outline">{formatSalary(selected)}</Badge>}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">About the role</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selected.description}</p>
                </div>
                {selected.requirements && (
                  <div>
                    <h3 className="font-semibold mb-2">Requirements</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selected.requirements}</p>
                  </div>
                )}
                <Button className="w-full bg-gold hover:bg-gold/90 text-navy" onClick={() => setApplyOpen(true)}>
                  Apply for this position
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply dialog */}
      {selected && (
        <ApplyDialog
          job={selected}
          open={applyOpen}
          onClose={(success) => {
            setApplyOpen(false);
            if (success) setSelected(null);
          }}
        />
      )}
    </div>
  );
};

function ApplyDialog({ job, open, onClose }: { job: Job; open: boolean; onClose: (success: boolean) => void }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", cover_letter: "" });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = applySchema.parse(form);
      let resume_url: string | null = null;
      if (resumeFile) {
        if (resumeFile.size > 5 * 1024 * 1024) throw new Error("Resume must be under 5MB");
        const path = `${job.id}/${Date.now()}-${resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("resumes").upload(path, resumeFile);
        if (upErr) throw upErr;
        resume_url = path;
      }
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("job_applications").insert({
        job_id: job.id,
        user_id: userData.user?.id ?? null,
        full_name: parsed.full_name,
        email: parsed.email,
        phone: parsed.phone || null,
        cover_letter: parsed.cover_letter || null,
        resume_url,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Application submitted", description: "We'll be in touch soon." });
      onClose(true);
    },
    onError: (e: any) => {
      toast({ title: "Could not submit", description: e.message || "Please check the form", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply: {job.title}</DialogTitle>
          <DialogDescription>Fill out the form to submit your application.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Full name *</Label>
            <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Resume (PDF/DOC, max 5MB)</Label>
            <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <Label>Cover letter</Label>
            <Textarea rows={5} value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full bg-gold hover:bg-gold/90 text-navy">
            {mutation.isPending ? "Submitting..." : "Submit application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Careers;
