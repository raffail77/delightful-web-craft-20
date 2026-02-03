-- Create atomic contract completion function
CREATE OR REPLACE FUNCTION public.complete_contract(
  p_contract_id UUID,
  p_user_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract contracts;
  v_is_provider BOOLEAN;
  v_is_client BOOLEAN;
  v_transaction_id UUID;
BEGIN
  -- Lock the contract row to prevent race conditions
  SELECT * INTO v_contract
  FROM contracts
  WHERE id = p_contract_id
  FOR UPDATE;
  
  -- Check if contract exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  -- Verify user is part of contract
  v_is_provider := v_contract.provider_id = p_user_id;
  v_is_client := v_contract.client_id = p_user_id;
  
  IF NOT (v_is_provider OR v_is_client) THEN
    RAISE EXCEPTION 'Unauthorized: User is not part of this contract';
  END IF;
  
  -- Verify contract is in correct status
  IF v_contract.status != 'in_progress' THEN
    RAISE EXCEPTION 'Contract must be in progress to confirm completion. Current status: %', v_contract.status;
  END IF;
  
  -- Update the appropriate confirmation flag
  IF v_is_provider THEN
    -- Check if already confirmed
    IF v_contract.provider_confirmed THEN
      RAISE EXCEPTION 'Provider has already confirmed';
    END IF;
    
    UPDATE contracts 
    SET provider_confirmed = true,
        updated_at = NOW()
    WHERE id = p_contract_id;
  ELSE
    -- Check if already confirmed
    IF v_contract.client_confirmed THEN
      RAISE EXCEPTION 'Client has already confirmed';
    END IF;
    
    UPDATE contracts 
    SET client_confirmed = true,
        updated_at = NOW()
    WHERE id = p_contract_id;
  END IF;
  
  -- Re-fetch to check if both parties have now confirmed
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
  
  -- If both confirmed, process payment atomically
  IF v_contract.provider_confirmed AND v_contract.client_confirmed THEN
    -- Call the existing transfer_credits function
    -- This already handles locking and balance checks
    SELECT transfer_credits(
      v_contract.client_id,
      v_contract.provider_id,
      v_contract.agreed_credits,
      v_contract.service_id,
      'Contract payment: ' || v_contract.title
    ) INTO v_transaction_id;
    
    -- Update contract to completed
    UPDATE contracts
    SET status = 'completed',
        completed_at = NOW(),
        transaction_id = v_transaction_id,
        updated_at = NOW()
    WHERE id = p_contract_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'completed', true,
      'transaction_id', v_transaction_id::text,
      'message', 'Contract completed and payment processed'
    );
  END IF;
  
  -- Return waiting status
  RETURN jsonb_build_object(
    'success', true,
    'completed', false,
    'waiting_for', CASE 
      WHEN v_is_provider THEN 'client'
      ELSE 'provider'
    END,
    'message', 'Waiting for other party to confirm completion'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_contract(UUID, UUID) TO authenticated;