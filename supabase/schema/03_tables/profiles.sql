-- Profiles: owner-only direct access; cross-user reads go through profiles_public view
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  email text,
  avatar_url text,
  bio text,
  skills text[],
  time_credits integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  cover_url text,
  headline text,
  location text,
  availability_status text DEFAULT 'available'::text,
  about text,
  response_time_hours integer,
  is_verified boolean DEFAULT false,
  profile_visibility text DEFAULT 'public'::text,
  show_email boolean DEFAULT false,
  show_location boolean DEFAULT true,
  profile_slug text,
  is_suspended boolean DEFAULT false,
  earned_credits integer DEFAULT 0 NOT NULL,
  bonus_credits integer DEFAULT 5 NOT NULL,
  escrow_credits integer DEFAULT 0 NOT NULL,
  stripe_connect_account_id text,
  stripe_connect_onboarding_complete boolean DEFAULT false,
  last_free_credits_at timestamptz
);

CREATE INDEX idx_profiles_slug ON public.profiles USING btree (profile_slug);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  USING ((auth.uid() = user_id));

CREATE TRIGGER generate_profile_slug_trigger
  BEFORE UPDATE OR INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION generate_profile_slug();
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
