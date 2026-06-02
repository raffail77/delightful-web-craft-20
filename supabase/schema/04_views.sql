-- ============================================================================
-- Views
-- profiles_public is a SECURITY DEFINER view that exposes a masked subset of
-- profiles for cross-user reads. PII (email, time_credits, escrow, Stripe IDs)
-- is NULL for non-owners/non-admins. The underlying profiles table SELECT
-- policy is owner-only, so this view is the only path for cross-user reads.
-- ============================================================================

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = false, security_barrier = true)
AS
 SELECT id,
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
            WHEN show_email = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN email
            ELSE NULL::text
        END AS email,
        CASE
            WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN time_credits
            ELSE NULL::integer
        END AS time_credits,
        CASE
            WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN earned_credits
            ELSE NULL::integer
        END AS earned_credits,
        CASE
            WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN bonus_credits
            ELSE NULL::integer
        END AS bonus_credits,
        CASE
            WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN escrow_credits
            ELSE NULL::integer
        END AS escrow_credits,
        CASE
            WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN stripe_connect_account_id
            ELSE NULL::text
        END AS stripe_connect_account_id,
        CASE
            WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN stripe_connect_onboarding_complete
            ELSE NULL::boolean
        END AS stripe_connect_onboarding_complete
   FROM profiles
  WHERE profile_visibility = 'public'::text OR profile_visibility = 'members'::text AND auth.uid() IS NOT NULL OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role);
;

GRANT SELECT ON public.profiles_public TO anon, authenticated;
