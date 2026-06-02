CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  issuing_organization text NOT NULL,
  issue_date date,
  expiry_date date,
  credential_id text,
  credential_url text,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.certifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT ALL ON public.certifications TO service_role;

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view certifications" ON public.certifications
  FOR SELECT
  USING (true);

CREATE POLICY "Users can delete their own certifications" ON public.certifications
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can manage their own certifications" ON public.certifications
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own certifications" ON public.certifications
  FOR UPDATE
  USING ((auth.uid() = user_id));
