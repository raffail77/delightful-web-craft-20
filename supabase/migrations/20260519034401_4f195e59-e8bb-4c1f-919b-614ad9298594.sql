
-- HELP ARTICLES
CREATE TABLE public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  excerpt text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  view_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view published help" ON public.help_articles FOR SELECT USING (status = 'published');
CREATE POLICY "Admins view all help" ON public.help_articles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage help" ON public.help_articles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_help_articles_updated BEFORE UPDATE ON public.help_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_help_view(p_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.help_articles SET view_count = view_count + 1 WHERE slug = p_slug AND status = 'published';
$$;

-- INCIDENTS
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'investigating',
  severity text NOT NULL DEFAULT 'minor',
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Admins manage incidents" ON public.incidents FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SERVICE STATUS
CREATE TABLE public.service_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'operational',
  uptime_percentage numeric NOT NULL DEFAULT 100,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view service status" ON public.service_status FOR SELECT USING (true);
CREATE POLICY "Admins manage service status" ON public.service_status FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_service_status_updated BEFORE UPDATE ON public.service_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRICING PLANS
CREATE TABLE public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_label text NOT NULL DEFAULT 'Get Started',
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active plans" ON public.pricing_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins view all plans" ON public.pricing_plans FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage plans" ON public.pricing_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_pricing_plans_updated BEFORE UPDATE ON public.pricing_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- LEGAL DOCUMENTS
CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view legal" ON public.legal_documents FOR SELECT USING (true);
CREATE POLICY "Admins manage legal" ON public.legal_documents FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_legal_documents_updated BEFORE UPDATE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed legal slugs and a default service row
INSERT INTO public.legal_documents (slug, title, content) VALUES
  ('privacy', 'Privacy Policy', '# Privacy Policy\n\nUpdate this content from the admin dashboard.'),
  ('terms', 'Terms of Service', '# Terms of Service\n\nUpdate this content from the admin dashboard.'),
  ('cookies', 'Cookie Policy', '# Cookie Policy\n\nUpdate this content from the admin dashboard.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.service_status (name, status, uptime_percentage, sort_order) VALUES
  ('Web Application', 'operational', 99.99, 1),
  ('API', 'operational', 99.95, 2),
  ('Database', 'operational', 99.99, 3),
  ('Authentication', 'operational', 99.98, 4),
  ('Messaging', 'operational', 99.97, 5),
  ('Notifications', 'operational', 99.94, 6);
