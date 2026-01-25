-- Create contract status enum
CREATE TYPE public.contract_status AS ENUM (
  'proposed',
  'accepted', 
  'in_progress',
  'completed',
  'disputed',
  'cancelled'
);

-- Create contracts table for service exchange agreements
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL,
  client_id UUID NOT NULL,
  proposed_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  agreed_credits INTEGER NOT NULL CHECK (agreed_credits > 0),
  status contract_status NOT NULL DEFAULT 'proposed',
  provider_confirmed BOOLEAN NOT NULL DEFAULT false,
  client_confirmed BOOLEAN NOT NULL DEFAULT false,
  transaction_id UUID REFERENCES public.transactions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT different_parties CHECK (provider_id != client_id)
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Users can view contracts they are part of
CREATE POLICY "Users can view their contracts"
ON public.contracts
FOR SELECT
USING (auth.uid() = provider_id OR auth.uid() = client_id);

-- Users can create contracts they are part of
CREATE POLICY "Users can create contracts"
ON public.contracts
FOR INSERT
WITH CHECK (
  auth.uid() = proposed_by AND 
  (auth.uid() = provider_id OR auth.uid() = client_id)
);

-- Users can update contracts they are part of
CREATE POLICY "Users can update their contracts"
ON public.contracts
FOR UPDATE
USING (auth.uid() = provider_id OR auth.uid() = client_id);

-- Create trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for contracts
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;