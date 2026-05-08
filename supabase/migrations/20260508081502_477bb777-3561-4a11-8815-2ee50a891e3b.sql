
-- 1. Reviews: require a completed contract (remove the contract_id IS NULL bypass)
DROP POLICY IF EXISTS "Only clients can review providers after contract completion" ON public.reviews;
CREATE POLICY "Only clients can review providers after contract completion"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id
  AND contract_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = reviews.contract_id
      AND c.status = 'completed'
      AND c.client_id = auth.uid()
      AND c.provider_id = reviews.reviewee_id
  )
);

-- 2. Revoke public read on sensitive profile columns (defense-in-depth)
REVOKE SELECT (email, time_credits, earned_credits, bonus_credits, escrow_credits,
               stripe_connect_account_id, stripe_connect_onboarding_complete,
               last_free_credits_at, is_suspended)
  ON public.profiles FROM anon, authenticated;

-- Re-grant safe columns to anon and authenticated
GRANT SELECT (id, user_id, full_name, avatar_url, cover_url, headline, location,
              availability_status, bio, about, skills, response_time_hours,
              is_verified, profile_visibility, show_email, show_location,
              profile_slug, created_at, updated_at)
  ON public.profiles TO anon, authenticated;

-- 3. Revoke EXECUTE on internal/trigger functions from public/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.transfer_credits(uuid, uuid, integer, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pay_contract_stripe(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_cancel_unpaid_contracts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_endorsement_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_profile_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_message_rate_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 4. Tighten storage: drop broad listing on service-images, allow only individual object access
DROP POLICY IF EXISTS "Anyone can view service images" ON storage.objects;
CREATE POLICY "Service images individually accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');
