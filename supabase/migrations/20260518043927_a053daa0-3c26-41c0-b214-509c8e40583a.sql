
-- JOBS
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  employment_type text NOT NULL DEFAULT 'Full-time',
  salary_min numeric,
  salary_max numeric,
  salary_currency text DEFAULT 'USD',
  description text NOT NULL,
  requirements text,
  status text NOT NULL DEFAULT 'open',
  posted_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view open jobs" ON public.jobs FOR SELECT USING (status = 'open');
CREATE POLICY "Admins view all jobs" ON public.jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage jobs" ON public.jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- JOB APPLICATIONS
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cover_letter text,
  resume_url text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can apply" ON public.job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own applications" ON public.job_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all applications" ON public.job_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage applications" ON public.job_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete applications" ON public.job_applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BLOG POSTS
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  thumbnail_url text,
  category text,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  author_id uuid,
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins view all posts" ON public.blog_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_blog_view(p_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.blog_posts SET view_count = view_count + 1 WHERE slug = p_slug AND status = 'published';
$$;

-- CONTACT MESSAGES
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  category text DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view all contact" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage contact" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete contact" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-thumbnails','blog-thumbnails',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('media-kit','media-kit',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes','resumes',false) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read blog thumbs" ON storage.objects FOR SELECT USING (bucket_id = 'blog-thumbnails');
CREATE POLICY "Admin write blog thumbs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog-thumbnails' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update blog thumbs" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'blog-thumbnails' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete blog thumbs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'blog-thumbnails' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public read media kit" ON storage.objects FOR SELECT USING (bucket_id = 'media-kit');
CREATE POLICY "Admin write media kit" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media-kit' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update media kit" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media-kit' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete media kit" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media-kit' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Anyone upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Admin read resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND public.has_role(auth.uid(),'admin'));
