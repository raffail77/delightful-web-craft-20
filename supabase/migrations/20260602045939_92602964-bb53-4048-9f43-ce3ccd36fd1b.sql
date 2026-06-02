
-- 1. Tighten profiles SELECT policy: only owner can read own row directly.
DROP POLICY IF EXISTS "Profiles visible based on privacy settings" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Rebuild profiles_public view with security_invoker=false so it bypasses
--    the new owner-only policy, and expose sensitive cols only to owner/admin.
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = false, security_barrier = true) AS
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
  CASE
    WHEN show_email = true
      OR auth.uid() = user_id
      OR public.has_role(auth.uid(), 'admin')
      THEN email
    ELSE NULL
  END AS email,
  CASE
    WHEN auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
      THEN time_credits ELSE NULL
  END AS time_credits,
  CASE
    WHEN auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
      THEN earned_credits ELSE NULL
  END AS earned_credits,
  CASE
    WHEN auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
      THEN bonus_credits ELSE NULL
  END AS bonus_credits,
  CASE
    WHEN auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
      THEN escrow_credits ELSE NULL
  END AS escrow_credits,
  CASE
    WHEN auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
      THEN stripe_connect_account_id ELSE NULL
  END AS stripe_connect_account_id,
  CASE
    WHEN auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
      THEN stripe_connect_onboarding_complete ELSE NULL
  END AS stripe_connect_onboarding_complete
FROM public.profiles
WHERE profile_visibility = 'public'
   OR (profile_visibility = 'members' AND auth.uid() IS NOT NULL)
   OR auth.uid() = user_id
   OR public.has_role(auth.uid(), 'admin');

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 3. Realtime channel authorization: restrict subscriptions to participants.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read own realtime topics" ON realtime.messages;

CREATE POLICY "Authenticated users read own realtime topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- messages:<userId> topics
    (realtime.topic() LIKE 'messages:%'
       AND split_part(realtime.topic(), ':', 2) = auth.uid()::text)
    OR
    -- contracts:<userId> topics
    (realtime.topic() LIKE 'contracts:%'
       AND split_part(realtime.topic(), ':', 2) = auth.uid()::text)
    OR
    -- generic 'messages' / 'contracts' broadcast (fallback: any authenticated;
    -- payloads are still filtered by table RLS on insert via postgres_changes)
    realtime.topic() IN ('messages', 'contracts')
  );
