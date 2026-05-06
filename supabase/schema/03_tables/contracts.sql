CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid,
  provider_id uuid NOT NULL,
  client_id uuid NOT NULL,
  proposed_by uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  agreed_credits integer NOT NULL,
  status public.contract_status NOT NULL DEFAULT 'proposed',
  payment_method public.payment_method NOT NULL DEFAULT 'credits',
  provider_confirmed boolean NOT NULL DEFAULT false,
  client_confirmed boolean NOT NULL DEFAULT false,
  escrow_locked boolean NOT NULL DEFAULT false,
  escrow_locked_at timestamptz,
  stripe_payment_intent_id text,
  transaction_id uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Users can create contracts" ON public.contracts
  FOR INSERT WITH CHECK (
    auth.uid() = proposed_by AND (auth.uid() = provider_id OR auth.uid() = client_id)
  );

CREATE POLICY "Users can update their contracts" ON public.contracts
  FOR UPDATE USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Admins can view all contracts" ON public.contracts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any contract" ON public.contracts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any contract" ON public.contracts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
