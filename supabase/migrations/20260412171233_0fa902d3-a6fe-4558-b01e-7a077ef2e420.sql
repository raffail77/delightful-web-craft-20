
-- Drop and recreate as security barrier view
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public WITH (security_barrier = true, security_invoker = true) AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  bio,
  about,
  cover_url,
  headline,
  location,
  availability_status,
  skills,
  profile_slug,
  profile_visibility,
  is_verified,
  response_time_hours,
  created_at,
  updated_at,
  CASE WHEN show_email = true OR auth.uid() = user_id THEN email ELSE NULL END AS email,
  CASE WHEN show_location = true OR auth.uid() = user_id THEN location ELSE NULL END AS display_location,
  CASE WHEN auth.uid() = user_id THEN time_credits ELSE NULL END AS time_credits,
  CASE WHEN auth.uid() = user_id THEN earned_credits ELSE NULL END AS earned_credits,
  CASE WHEN auth.uid() = user_id THEN bonus_credits ELSE NULL END AS bonus_credits,
  CASE WHEN auth.uid() = user_id THEN escrow_credits ELSE NULL END AS escrow_credits,
  CASE WHEN auth.uid() = user_id THEN show_email ELSE NULL END AS show_email,
  CASE WHEN auth.uid() = user_id THEN show_location ELSE NULL END AS show_location,
  CASE WHEN auth.uid() = user_id THEN is_suspended ELSE NULL END AS is_suspended,
  CASE WHEN auth.uid() = user_id THEN last_free_credits_at ELSE NULL END AS last_free_credits_at,
  CASE WHEN auth.uid() = user_id THEN stripe_connect_account_id ELSE NULL END AS stripe_connect_account_id,
  CASE WHEN auth.uid() = user_id THEN stripe_connect_onboarding_complete ELSE NULL END AS stripe_connect_onboarding_complete
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;
