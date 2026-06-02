CREATE TABLE public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_date date,
  end_date date,
  grade text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_education_user_id ON public.education USING btree (user_id);

GRANT SELECT ON public.education TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education TO authenticated;
GRANT ALL ON public.education TO service_role;

ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view education" ON public.education
  FOR SELECT
  USING (true);

CREATE POLICY "Users can delete their own education" ON public.education
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can manage their own education" ON public.education
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own education" ON public.education
  FOR UPDATE
  USING ((auth.uid() = user_id));
