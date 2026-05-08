
-- 1. Contracts: prevent self-dealing
DROP POLICY IF EXISTS "Users can create contracts" ON public.contracts;
CREATE POLICY "Users can create contracts"
ON public.contracts
FOR INSERT
WITH CHECK (
  auth.uid() = proposed_by
  AND (auth.uid() = provider_id OR auth.uid() = client_id)
  AND provider_id <> client_id
);

-- 2. user_skills: revoke UPDATE on endorsement_count from regular users
REVOKE UPDATE (endorsement_count) ON public.user_skills FROM anon, authenticated;

-- (the trigger function update_endorsement_count is SECURITY DEFINER so it can still update)
