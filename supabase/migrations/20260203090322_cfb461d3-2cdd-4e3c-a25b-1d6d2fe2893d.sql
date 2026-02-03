-- Drop the existing insert policy for reviews
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

-- Create a new policy that ensures only the CLIENT of a COMPLETED contract can create a review
-- The reviewer must be the client_id and reviewee must be the provider_id
CREATE POLICY "Only clients can review providers after contract completion"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id
  AND (
    -- If contract_id is provided, validate the relationship
    (contract_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND c.status = 'completed'
      AND c.client_id = auth.uid()  -- Reviewer must be the client (payer)
      AND c.provider_id = reviewee_id  -- Reviewee must be the provider
    ))
    -- If no contract_id, allow general reviews (for backward compatibility, can be removed if not needed)
    OR contract_id IS NULL
  )
);