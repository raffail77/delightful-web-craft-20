CREATE TABLE public.endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.endorsements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.endorsements TO authenticated;
GRANT ALL ON public.endorsements TO service_role;

ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view endorsements" ON public.endorsements
  FOR SELECT
  USING (true);

CREATE POLICY "Users can endorse skills" ON public.endorsements
  FOR INSERT
  WITH CHECK ((auth.uid() = endorser_id));

CREATE POLICY "Users can remove their endorsements" ON public.endorsements
  FOR DELETE
  USING ((auth.uid() = endorser_id));

CREATE TRIGGER update_endorsement_count_trigger
  AFTER DELETE OR INSERT ON public.endorsements
  FOR EACH ROW EXECUTE FUNCTION update_endorsement_count();
