CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  full_name text,
  avatar_url text,
  cover_url text,
  headline text,
  location text,
  availability_status text DEFAULT 'available',
  bio text,
  about text,
  skills text[],
  time_credits integer NOT NULL DEFAULT 0,
  earned_credits integer NOT NULL DEFAULT 0,
  bonus_credits integer NOT NULL DEFAULT 5,
  escrow_credits integer NOT NULL DEFAULT 0,
  last_free_credits_at timestamptz,
  response_time_hours integer,
  is_verified boolean DEFAULT false,
  is_suspended boolean DEFAULT false,
  profile_visibility text DEFAULT 'public',
  show_email boolean DEFAULT false,
  show_location boolean DEFAULT true,
  profile_slug text UNIQUE,
  stripe_connect_account_id text,
  stripe_connect_onboarding_complete boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles visible based on privacy settings" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR profile_visibility = 'public'
    OR (profile_visibility = 'members' AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
