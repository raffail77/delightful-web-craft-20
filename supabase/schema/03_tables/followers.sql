CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_followers_following_id ON public.followers USING btree (following_id);

GRANT SELECT ON public.followers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followers TO authenticated;
GRANT ALL ON public.followers TO service_role;

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view followers" ON public.followers
  FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others" ON public.followers
  FOR INSERT
  WITH CHECK ((auth.uid() = follower_id));

CREATE POLICY "Users can unfollow" ON public.followers
  FOR DELETE
  USING ((auth.uid() = follower_id));
