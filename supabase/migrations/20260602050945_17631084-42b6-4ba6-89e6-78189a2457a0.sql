
-- 1. Tighten contracts UPDATE policy: prevent direct writes to critical fields
DROP POLICY IF EXISTS "Users can update their contracts" ON public.contracts;

CREATE POLICY "Users can update their contracts"
ON public.contracts
FOR UPDATE
TO authenticated
USING ((auth.uid() = provider_id) OR (auth.uid() = client_id))
WITH CHECK (
  ((auth.uid() = provider_id) OR (auth.uid() = client_id))
  -- Immutable critical fields: must match existing row values
  AND status = (SELECT status FROM public.contracts WHERE id = contracts.id)
  AND client_confirmed = (SELECT client_confirmed FROM public.contracts WHERE id = contracts.id)
  AND provider_confirmed = (SELECT provider_confirmed FROM public.contracts WHERE id = contracts.id)
  AND agreed_credits = (SELECT agreed_credits FROM public.contracts WHERE id = contracts.id)
  AND escrow_locked = (SELECT escrow_locked FROM public.contracts WHERE id = contracts.id)
  AND provider_id = (SELECT provider_id FROM public.contracts WHERE id = contracts.id)
  AND client_id = (SELECT client_id FROM public.contracts WHERE id = contracts.id)
  AND payment_method = (SELECT payment_method FROM public.contracts WHERE id = contracts.id)
);

-- 2. Restrict resume uploads to authenticated users
DROP POLICY IF EXISTS "Anyone upload resumes" ON storage.objects;

CREATE POLICY "Authenticated users upload resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);
