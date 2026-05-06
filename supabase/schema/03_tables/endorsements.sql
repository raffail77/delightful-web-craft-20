CREATE TABLE public.endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (endorser_id, skill_id)
);

ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view endorsements" ON public.endorsements FOR SELECT USING (true);
CREATE POLICY "Users can endorse skills" ON public.endorsements
  FOR INSERT WITH CHECK (auth.uid() = endorser_id);
CREATE POLICY "Users can remove their endorsements" ON public.endorsements
  FOR DELETE USING (auth.uid() = endorser_id);
