CREATE TABLE public.user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category professional_category NOT NULL,
  custom_category text,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.user_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_categories TO authenticated;
GRANT ALL ON public.user_categories TO service_role;

ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user categories" ON public.user_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Users can delete their own categories" ON public.user_categories
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can manage their own categories" ON public.user_categories
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own categories" ON public.user_categories
  FOR UPDATE
  USING ((auth.uid() = user_id));
