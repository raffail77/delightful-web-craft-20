CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommender_id uuid NOT NULL,
  recommendee_id uuid NOT NULL,
  relationship text,
  content text NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.recommendations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible recommendations" ON public.recommendations
  FOR SELECT
  USING (((is_visible = true) OR (auth.uid() = recommendee_id)));

CREATE POLICY "Users can delete their given recommendations" ON public.recommendations
  FOR DELETE
  USING ((auth.uid() = recommender_id));

CREATE POLICY "Users can give recommendations" ON public.recommendations
  FOR INSERT
  WITH CHECK ((auth.uid() = recommender_id));

CREATE POLICY "Users can update their given recommendations" ON public.recommendations
  FOR UPDATE
  USING ((auth.uid() = recommender_id));
