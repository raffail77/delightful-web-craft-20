CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  contract_id uuid,
  rating integer NOT NULL,
  title text,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reviews_reviewee_id ON public.reviews USING btree (reviewee_id);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete any review" ON public.reviews
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any review" ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all reviews" ON public.reviews
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Only clients can review providers after contract completion" ON public.reviews
  FOR INSERT
  WITH CHECK (((auth.uid() = reviewer_id) AND (contract_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM contracts c   WHERE ((c.id = reviews.contract_id) AND (c.status = 'completed'::contract_status) AND (c.client_id = auth.uid()) AND (c.provider_id = reviews.reviewee_id))))));

CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE
  USING ((auth.uid() = reviewer_id));

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE
  USING ((auth.uid() = reviewer_id));
