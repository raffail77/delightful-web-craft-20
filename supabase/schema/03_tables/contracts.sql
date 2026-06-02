-- Contracts: financial fields locked via WITH CHECK; state transitions only via SECURITY DEFINER RPCs
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid,
  provider_id uuid NOT NULL,
  client_id uuid NOT NULL,
  proposed_by uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  agreed_credits integer NOT NULL,
  status contract_status DEFAULT 'proposed'::contract_status NOT NULL,
  provider_confirmed boolean DEFAULT false NOT NULL,
  client_confirmed boolean DEFAULT false NOT NULL,
  transaction_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  payment_method payment_method DEFAULT 'credits'::payment_method NOT NULL,
  escrow_locked boolean DEFAULT false NOT NULL,
  escrow_locked_at timestamptz,
  stripe_payment_intent_id text
);

GRANT SELECT ON public.contracts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete any contract" ON public.contracts
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any contract" ON public.contracts
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all contracts" ON public.contracts
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create contracts" ON public.contracts
  FOR INSERT
  WITH CHECK (((auth.uid() = proposed_by) AND ((auth.uid() = provider_id) OR (auth.uid() = client_id)) AND (provider_id <> client_id)));

CREATE POLICY "Users can update their contracts" ON public.contracts
  FOR UPDATE
  TO authenticated
  USING (((auth.uid() = provider_id) OR (auth.uid() = client_id)))
  WITH CHECK (((auth.uid() = provider_id) OR (auth.uid() = client_id)));

CREATE POLICY "Users can view their contracts" ON public.contracts
  FOR SELECT
  USING (((auth.uid() = provider_id) OR (auth.uid() = client_id)));

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
