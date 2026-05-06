-- Accept a contract and lock escrow (or move to pending_payment for stripe)
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
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.proposed_by = p_user_id THEN RAISE EXCEPTION 'Cannot accept your own proposal'; END IF;
  IF NOT (v_contract.provider_id = p_user_id OR v_contract.client_id = p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a participant';
  END IF;
  IF v_contract.status != 'proposed' THEN
    RAISE EXCEPTION 'Contract is not in proposed status';
  END IF;

  IF v_contract.payment_method IN ('credits', 'both') THEN
    SELECT time_credits INTO v_client_balance
    FROM profiles WHERE user_id = v_contract.client_id FOR UPDATE;

    IF v_client_balance IS NULL THEN RAISE EXCEPTION 'Client profile not found'; END IF;
    IF v_client_balance < v_contract.agreed_credits THEN
      RAISE EXCEPTION 'Insufficient credits. Balance: %, Required: %', v_client_balance, v_contract.agreed_credits;
    END IF;

    UPDATE profiles
    SET time_credits = time_credits - v_contract.agreed_credits,
        escrow_credits = escrow_credits + v_contract.agreed_credits,
        updated_at = now()
    WHERE user_id = v_contract.client_id;

    UPDATE contracts
    SET status = 'accepted', escrow_locked = true, escrow_locked_at = now(), updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object('success', true, 'message', 'Contract accepted with credits locked in escrow', 'escrow_locked', true);
  ELSE
    UPDATE contracts SET status = 'pending_payment', updated_at = now() WHERE id = p_contract_id;
    RETURN jsonb_build_object('success', true, 'message', 'Contract accepted. Awaiting Stripe payment from client.', 'escrow_locked', false, 'requires_payment', true);
  END IF;
END;
$$;

-- Record stripe payment and activate
CREATE OR REPLACE FUNCTION public.pay_contract_stripe(p_contract_id uuid, p_user_id uuid, p_payment_intent_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contract contracts;
BEGIN
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.client_id != p_user_id THEN RAISE EXCEPTION 'Only the client can make payment'; END IF;
  IF v_contract.status != 'pending_payment' THEN
    RAISE EXCEPTION 'Contract is not awaiting payment. Current status: %', v_contract.status;
  END IF;

  UPDATE contracts
  SET status = 'accepted', stripe_payment_intent_id = p_payment_intent_id,
      escrow_locked = true, escrow_locked_at = now(), updated_at = now()
  WHERE id = p_contract_id;

  RETURN jsonb_build_object('success', true, 'message', 'Payment recorded. Contract is now active.', 'escrow_locked', true);
END;
$$;

-- Mutual confirmation; releases escrow when both sides confirm
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
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;

  v_is_provider := v_contract.provider_id = p_user_id;
  v_is_client := v_contract.client_id = p_user_id;
  IF NOT (v_is_provider OR v_is_client) THEN RAISE EXCEPTION 'Unauthorized: User is not part of this contract'; END IF;
  IF v_contract.status != 'in_progress' THEN
    RAISE EXCEPTION 'Contract must be in progress. Current status: %', v_contract.status;
  END IF;

  IF v_is_provider THEN
    IF v_contract.provider_confirmed THEN RAISE EXCEPTION 'Provider has already confirmed'; END IF;
    UPDATE contracts SET provider_confirmed = true, updated_at = NOW() WHERE id = p_contract_id;
  ELSE
    IF v_contract.client_confirmed THEN RAISE EXCEPTION 'Client has already confirmed'; END IF;
    UPDATE contracts SET client_confirmed = true, updated_at = NOW() WHERE id = p_contract_id;
  END IF;

  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;

  IF v_contract.provider_confirmed AND v_contract.client_confirmed THEN
    IF v_contract.payment_method IN ('credits', 'both') THEN
      IF v_contract.escrow_locked THEN
        UPDATE profiles
        SET escrow_credits = GREATEST(escrow_credits - v_contract.agreed_credits, 0), updated_at = now()
        WHERE user_id = v_contract.client_id;

        UPDATE profiles
        SET time_credits = time_credits + v_contract.agreed_credits,
            earned_credits = earned_credits + v_contract.agreed_credits, updated_at = now()
        WHERE user_id = v_contract.provider_id;
      ELSE
        SELECT transfer_credits(v_contract.client_id, v_contract.provider_id,
                                v_contract.agreed_credits, v_contract.service_id,
                                'Contract payment: ' || v_contract.title) INTO v_transaction_id;
      END IF;

      INSERT INTO transactions (sender_id, receiver_id, service_id, amount, description, status, transaction_type, completed_at)
      VALUES (v_contract.client_id, v_contract.provider_id, v_contract.service_id, v_contract.agreed_credits,
              'Contract payment: ' || v_contract.title, 'completed', 'service_payment', now())
      RETURNING id INTO v_transaction_id;
    END IF;

    UPDATE contracts
    SET status = 'completed', completed_at = NOW(), escrow_locked = false,
        transaction_id = v_transaction_id, updated_at = NOW()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object('success', true, 'completed', true,
      'transaction_id', COALESCE(v_transaction_id::text, ''),
      'payment_method', v_contract.payment_method::text,
      'message', 'Contract completed and payment processed');
  END IF;

  RETURN jsonb_build_object('success', true, 'completed', false,
    'waiting_for', CASE WHEN v_is_provider THEN 'client' ELSE 'provider' END,
    'message', 'Waiting for other party to confirm completion');
END;
$$;

-- Cancel and refund escrow
CREATE OR REPLACE FUNCTION public.cancel_contract_with_escrow(p_contract_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contract contracts;
BEGIN
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF NOT (v_contract.provider_id = p_user_id OR v_contract.client_id = p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_contract.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Contract already finalized';
  END IF;

  IF v_contract.escrow_locked AND v_contract.payment_method IN ('credits', 'both') THEN
    UPDATE profiles
    SET time_credits = time_credits + v_contract.agreed_credits,
        escrow_credits = GREATEST(escrow_credits - v_contract.agreed_credits, 0), updated_at = now()
    WHERE user_id = v_contract.client_id;
  END IF;

  UPDATE contracts SET status = 'cancelled', escrow_locked = false, updated_at = now()
  WHERE id = p_contract_id;

  RETURN jsonb_build_object('success', true, 'message', 'Contract cancelled and escrow refunded');
END;
$$;

-- Cron-friendly cleanup: cancel unpaid contracts after 48h
CREATE OR REPLACE FUNCTION public.auto_cancel_unpaid_contracts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE contracts SET status = 'cancelled', updated_at = now()
  WHERE status = 'pending_payment' AND updated_at < now() - interval '48 hours';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
