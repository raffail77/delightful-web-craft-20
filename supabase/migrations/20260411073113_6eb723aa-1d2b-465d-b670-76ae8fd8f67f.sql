
-- Add pending_payment to contract_status enum
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'pending_payment' AFTER 'proposed';

-- Update accept_contract_with_escrow to handle Stripe flow
CREATE OR REPLACE FUNCTION public.accept_contract_with_escrow(p_contract_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contract contracts;
  v_client_balance INTEGER;
BEGIN
  SELECT * INTO v_contract
  FROM contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF v_contract.proposed_by = p_user_id THEN
    RAISE EXCEPTION 'Cannot accept your own proposal';
  END IF;

  IF NOT (v_contract.provider_id = p_user_id OR v_contract.client_id = p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a participant';
  END IF;

  IF v_contract.status != 'proposed' THEN
    RAISE EXCEPTION 'Contract is not in proposed status';
  END IF;

  IF v_contract.payment_method IN ('credits', 'both') THEN
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

    UPDATE profiles
    SET time_credits = time_credits - v_contract.agreed_credits,
        escrow_credits = escrow_credits + v_contract.agreed_credits,
        updated_at = now()
    WHERE user_id = v_contract.client_id;

    UPDATE contracts
    SET status = 'accepted',
        escrow_locked = true,
        escrow_locked_at = now(),
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Contract accepted with credits locked in escrow',
      'escrow_locked', true
    );
  ELSE
    -- Stripe-only: move to pending_payment, client must pay before work begins
    UPDATE contracts
    SET status = 'pending_payment',
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Contract accepted. Awaiting Stripe payment from client.',
      'escrow_locked', false,
      'requires_payment', true
    );
  END IF;
END;
$function$;

-- Function to record Stripe payment and activate contract
CREATE OR REPLACE FUNCTION public.pay_contract_stripe(p_contract_id uuid, p_user_id uuid, p_payment_intent_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Only client can pay
  IF v_contract.client_id != p_user_id THEN
    RAISE EXCEPTION 'Only the client can make payment';
  END IF;

  IF v_contract.status != 'pending_payment' THEN
    RAISE EXCEPTION 'Contract is not awaiting payment. Current status: %', v_contract.status;
  END IF;

  UPDATE contracts
  SET status = 'accepted',
      stripe_payment_intent_id = p_payment_intent_id,
      escrow_locked = true,
      escrow_locked_at = now(),
      updated_at = now()
  WHERE id = p_contract_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Payment recorded. Contract is now active.',
    'escrow_locked', true
  );
END;
$function$;

-- Function to auto-cancel unpaid contracts after 48 hours
CREATE OR REPLACE FUNCTION public.auto_cancel_unpaid_contracts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE contracts
  SET status = 'cancelled',
      updated_at = now()
  WHERE status = 'pending_payment'
    AND updated_at < now() - interval '48 hours';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- Update complete_contract to also support pending_payment awareness
-- (no change needed - it already checks for in_progress status)
