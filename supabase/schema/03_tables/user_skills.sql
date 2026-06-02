CREATE TABLE public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_name text NOT NULL,
  proficiency_level integer DEFAULT 3,
  category professional_category,
  endorsement_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_skills_user_id ON public.user_skills USING btree (user_id);

GRANT SELECT ON public.user_skills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_skills TO authenticated;
GRANT ALL ON public.user_skills TO service_role;

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user skills" ON public.user_skills
  FOR SELECT
  USING (true);

CREATE POLICY "Users can delete their own skills" ON public.user_skills
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can manage their own skills" ON public.user_skills
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own skills" ON public.user_skills
  FOR UPDATE
  USING ((auth.uid() = user_id));
