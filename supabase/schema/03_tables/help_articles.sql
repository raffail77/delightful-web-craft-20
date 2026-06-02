CREATE TABLE public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL,
  excerpt text,
  content text NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.help_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.help_articles TO authenticated;
GRANT ALL ON public.help_articles TO service_role;

ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage help" ON public.help_articles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view all help" ON public.help_articles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone view published help" ON public.help_articles
  FOR SELECT
  USING ((status = 'published'::text));

CREATE TRIGGER trg_help_articles_updated
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
