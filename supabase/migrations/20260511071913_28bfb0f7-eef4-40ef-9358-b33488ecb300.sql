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
    ELSIF v_contract.payment_method = 'stripe' THEN
      -- Record transaction history for Stripe-paid contracts so they appear in wallet/transactions
      INSERT INTO transactions (sender_id, receiver_id, service_id, amount, description, status, transaction_type, completed_at)
      VALUES (v_contract.client_id, v_contract.provider_id, v_contract.service_id, v_contract.agreed_credits,
              'Contract payment (Stripe): ' || v_contract.title, 'completed', 'service_payment', now())
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