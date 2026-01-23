-- Create transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'cancelled', 'disputed');

-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('service_payment', 'refund', 'bonus', 'adjustment');

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  transaction_type public.transaction_type NOT NULL DEFAULT 'service_payment',
  status public.transaction_status NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent self-transfers
  CONSTRAINT no_self_transfer CHECK (sender_id != receiver_id)
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can only view transactions they're part of
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Only the system (via edge function with service role) can insert/update transactions
-- No direct INSERT/UPDATE policies for regular users - this prevents manipulation

-- Create index for faster queries
CREATE INDEX idx_transactions_sender ON public.transactions(sender_id);
CREATE INDEX idx_transactions_receiver ON public.transactions(receiver_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Create secure function to transfer credits (only callable by service role)
CREATE OR REPLACE FUNCTION public.transfer_credits(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_amount INTEGER,
  p_service_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Lock sender's profile to prevent race conditions
  SELECT time_credits INTO v_sender_balance
  FROM profiles
  WHERE user_id = p_sender_id
  FOR UPDATE;
  
  -- Check sufficient balance
  IF v_sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender profile not found';
  END IF;
  
  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Balance: %, Required: %', v_sender_balance, p_amount;
  END IF;
  
  -- Deduct from sender
  UPDATE profiles
  SET time_credits = time_credits - p_amount,
      updated_at = now()
  WHERE user_id = p_sender_id;
  
  -- Add to receiver
  UPDATE profiles
  SET time_credits = time_credits + p_amount,
      updated_at = now()
  WHERE user_id = p_receiver_id;
  
  -- Create transaction record
  INSERT INTO transactions (sender_id, receiver_id, service_id, amount, description, status, completed_at)
  VALUES (p_sender_id, p_receiver_id, p_service_id, p_amount, p_description, 'completed', now())
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Give new users starting credits (update existing function or create trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, time_credits)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    5  -- Starting bonus credits
  );
  RETURN NEW;
END;
$function$;