CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credits_amount integer NOT NULL,
  usd_amount numeric NOT NULL,
  fee_amount numeric DEFAULT 0 NOT NULL,
  net_amount numeric NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  notes text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawal_requests
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create withdrawals" ON public.withdrawal_requests
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));
