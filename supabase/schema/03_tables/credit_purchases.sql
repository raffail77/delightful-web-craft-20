CREATE TABLE public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid,
  credits integer NOT NULL,
  amount_usd numeric NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text DEFAULT 'pending'::text NOT NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_purchases TO authenticated;
GRANT ALL ON public.credit_purchases TO service_role;

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all purchases" ON public.credit_purchases
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own purchases" ON public.credit_purchases
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));
