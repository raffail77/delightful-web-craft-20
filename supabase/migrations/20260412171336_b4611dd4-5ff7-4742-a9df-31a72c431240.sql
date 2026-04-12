
-- Step 1: Drop the current public-facing SELECT policy
DROP POLICY IF EXISTS "Profiles visible based on privacy settings" ON public.profiles;

-- Step 2: Create a restricted SELECT policy - only owner can SELECT directly
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Step 3: Recreate the view as SECURITY DEFINER so it can access the base table
-- even though non-owners can't SELECT the table directly
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public WITH (security_barrier = true) AS
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
  CASE WHEN auth.uid() = user_id THEN time_credits ELSE NULL END AS time_credits,
  CASE WHEN auth.uid() = user_id THEN earned_credits ELSE NULL END AS earned_credits,
  CASE WHEN auth.uid() = user_id THEN bonus_credits ELSE NULL END AS bonus_credits,
  CASE WHEN auth.uid() = user_id THEN escrow_credits ELSE NULL END AS escrow_credits,
  CASE WHEN auth.uid() = user_id THEN stripe_connect_account_id ELSE NULL END AS stripe_connect_account_id,
  CASE WHEN auth.uid() = user_id THEN stripe_connect_onboarding_complete ELSE NULL END AS stripe_connect_onboarding_complete
FROM public.profiles;

-- Grant view access
GRANT SELECT ON public.profiles_public TO anon, authenticated;
