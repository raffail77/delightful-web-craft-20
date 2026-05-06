CREATE TABLE public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid,
  credits integer NOT NULL,
  amount_usd numeric NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.credit_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" ON public.credit_purchases
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Inserts/updates only via service-role (Stripe webhook).
