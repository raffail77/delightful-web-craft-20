
-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('credits', 'stripe', 'both');

-- Add payment_method to services
ALTER TABLE public.services ADD COLUMN payment_method public.payment_method NOT NULL DEFAULT 'credits';

-- Add payment/escrow columns to contracts
ALTER TABLE public.contracts ADD COLUMN payment_method public.payment_method NOT NULL DEFAULT 'credits';
ALTER TABLE public.contracts ADD COLUMN escrow_locked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN escrow_locked_at TIMESTAMPTZ;
ALTER TABLE public.contracts ADD COLUMN stripe_payment_intent_id TEXT;

-- Function to accept a contract and lock escrow
CREATE OR REPLACE FUNCTION public.accept_contract_with_escrow(p_contract_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contract contracts;
  v_client_balance INTEGER;
BEGIN
  -- Lock contract row
  SELECT * INTO v_contract
  FROM contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  -- Only the non-proposer can accept
  IF v_contract.proposed_by = p_user_id THEN
    RAISE EXCEPTION 'Cannot accept your own proposal';
  END IF;

  -- Must be participant
  IF NOT (v_contract.provider_id = p_user_id OR v_contract.client_id = p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a participant';
  END IF;

  -- Must be in proposed status
  IF v_contract.status != 'proposed' THEN
    RAISE EXCEPTION 'Contract is not in proposed status';
  END IF;

  -- For credit-based payments, lock credits in escrow
  IF v_contract.payment_method IN ('credits', 'both') THEN
    -- Check client balance
    SELECT time_credits INTO v_client_balance
    FROM profiles
    WHERE user_id = v_contract.client_id
    FOR UPDATE;

    IF v_client_balance IS NULL THEN
      RAISE EXCEPTION 'Client profile not found';
    END IF;

    IF v_client_balance < v_contract.agreed_credits THEN
      RAISE EXCEPTION 'Insufficient credits. Balance: %, Required: %', v_client_balance, v_contract.agreed_credits;
    END IF;

    -- Deduct from client, add to escrow
    UPDATE profiles
    SET time_credits = time_credits - v_contract.agreed_credits,
        escrow_credits = escrow_credits + v_contract.agreed_credits,
        updated_at = now()
    WHERE user_id = v_contract.client_id;

    -- Mark escrow as locked
    UPDATE contracts
    SET status = 'accepted',
        escrow_locked = true,
        escrow_locked_at = now(),
        updated_at = now()
    WHERE id = p_contract_id;
  ELSE
    -- Stripe-only: just accept, escrow handled externally
    UPDATE contracts
    SET status = 'accepted',
        updated_at = now()
    WHERE id = p_contract_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Contract accepted',
    'escrow_locked', v_contract.payment_method IN ('credits', 'both')
  );
END;
$$;

-- Function to cancel contract and refund escrow
CREATE OR REPLACE FUNCTION public.cancel_contract_with_escrow(p_contract_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contract contracts;
BEGIN
  SELECT * INTO v_contract
  FROM contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF NOT (v_contract.provider_id = p_user_id OR v_contract.client_id = p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_contract.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Contract already finalized';
  END IF;

  -- Refund escrow if locked
  IF v_contract.escrow_locked AND v_contract.payment_method IN ('credits', 'both') THEN
    UPDATE profiles
    SET time_credits = time_credits + v_contract.agreed_credits,
        escrow_credits = GREATEST(escrow_credits - v_contract.agreed_credits, 0),
        updated_at = now()
    WHERE user_id = v_contract.client_id;
  END IF;

  UPDATE contracts
  SET status = 'cancelled',
      escrow_locked = false,
      updated_at = now()
  WHERE id = p_contract_id;

  RETURN jsonb_build_object('success', true, 'message', 'Contract cancelled and escrow refunded');
END;
$$;

-- Update complete_contract to handle escrow release
CREATE OR REPLACE FUNCTION public.complete_contract(p_contract_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contract contracts;
  v_is_provider BOOLEAN;
  v_is_client BOOLEAN;
  v_transaction_id UUID;
BEGIN
  SELECT * INTO v_contract
  FROM contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  v_is_provider := v_contract.provider_id = p_user_id;
  v_is_client := v_contract.client_id = p_user_id;

  IF NOT (v_is_provider OR v_is_client) THEN
    RAISE EXCEPTION 'Unauthorized: User is not part of this contract';
  END IF;

  IF v_contract.status != 'in_progress' THEN
    RAISE EXCEPTION 'Contract must be in progress. Current status: %', v_contract.status;
  END IF;

  -- Update confirmation flag
  IF v_is_provider THEN
    IF v_contract.provider_confirmed THEN
      RAISE EXCEPTION 'Provider has already confirmed';
    END IF;
    UPDATE contracts SET provider_confirmed = true, updated_at = NOW() WHERE id = p_contract_id;
  ELSE
    IF v_contract.client_confirmed THEN
      RAISE EXCEPTION 'Client has already confirmed';
    END IF;
    UPDATE contracts SET client_confirmed = true, updated_at = NOW() WHERE id = p_contract_id;
  END IF;

  -- Re-fetch
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;

  -- If both confirmed, process payment
  IF v_contract.provider_confirmed AND v_contract.client_confirmed THEN
    IF v_contract.payment_method IN ('credits', 'both') THEN
      -- Release escrow: move from client's escrow to provider's earned
      IF v_contract.escrow_locked THEN
        UPDATE profiles
        SET escrow_credits = GREATEST(escrow_credits - v_contract.agreed_credits, 0),
            updated_at = now()
        WHERE user_id = v_contract.client_id;

        UPDATE profiles
        SET time_credits = time_credits + v_contract.agreed_credits,
            earned_credits = earned_credits + v_contract.agreed_credits,
            updated_at = now()
        WHERE user_id = v_contract.provider_id;
      ELSE
        -- Fallback: direct transfer (shouldn't happen with escrow)
        SELECT transfer_credits(
          v_contract.client_id,
          v_contract.provider_id,
          v_contract.agreed_credits,
          v_contract.service_id,
          'Contract payment: ' || v_contract.title
        ) INTO v_transaction_id;
      END IF;

      -- Record transaction
      INSERT INTO transactions (sender_id, receiver_id, service_id, amount, description, status, transaction_type, completed_at)
      VALUES (v_contract.client_id, v_contract.provider_id, v_contract.service_id, v_contract.agreed_credits,
              'Contract payment: ' || v_contract.title, 'completed', 'service_payment', now())
      RETURNING id INTO v_transaction_id;
    END IF;

    -- For stripe payment_method, the edge function handles capture separately

    UPDATE contracts
    SET status = 'completed',
        completed_at = NOW(),
        escrow_locked = false,
        transaction_id = v_transaction_id,
        updated_at = NOW()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
      'success', true,
      'completed', true,
      'transaction_id', COALESCE(v_transaction_id::text, ''),
      'payment_method', v_contract.payment_method::text,
      'message', 'Contract completed and payment processed'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'completed', false,
    'waiting_for', CASE WHEN v_is_provider THEN 'client' ELSE 'provider' END,
    'message', 'Waiting for other party to confirm completion'
  );
END;
$$;
