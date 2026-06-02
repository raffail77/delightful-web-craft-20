CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  service_id uuid,
  amount integer NOT NULL,
  transaction_type transaction_type DEFAULT 'service_payment'::transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending'::transaction_status NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at DESC);
CREATE INDEX idx_transactions_receiver ON public.transactions USING btree (receiver_id);
CREATE INDEX idx_transactions_sender ON public.transactions USING btree (sender_id);

GRANT SELECT ON public.transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT
  USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));
