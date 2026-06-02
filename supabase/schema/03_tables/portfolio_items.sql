CREATE TABLE public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  project_url text,
  image_url text,
  media_type text DEFAULT 'image'::text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_portfolio_items_user_id ON public.portfolio_items USING btree (user_id);

GRANT SELECT ON public.portfolio_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio visible based on profile privacy settings" ON public.portfolio_items
  FOR SELECT
  USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.user_id = portfolio_items.user_id) AND ((p.profile_visibility = 'public'::text) OR ((p.profile_visibility = 'members'::text) AND (auth.uid() IS NOT NULL))))))));

CREATE POLICY "Users can delete their own portfolio" ON public.portfolio_items
  FOR DELETE
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can manage their own portfolio" ON public.portfolio_items
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own portfolio" ON public.portfolio_items
  FOR UPDATE
  USING ((auth.uid() = user_id));
