
-- Restore simple UPDATE policy (no broken subqueries)
DROP POLICY IF EXISTS "Users can update their contracts" ON public.contracts;

CREATE POLICY "Users can update their contracts"
ON public.contracts
FOR UPDATE
TO authenticated
USING ((auth.uid() = provider_id) OR (auth.uid() = client_id))
WITH CHECK ((auth.uid() = provider_id) OR (auth.uid() = client_id));

-- Lock critical financial/state columns: only service_role (SECURITY DEFINER RPCs) may write them
REVOKE UPDATE (
  status,
  client_confirmed,
  provider_confirmed,
  agreed_credits,
  escrow_locked,
  escrow_locked_at,
  provider_id,
  client_id,
  payment_method,
  stripe_payment_intent_id,
  transaction_id,
  completed_at
) ON public.contracts FROM anon, authenticated;
