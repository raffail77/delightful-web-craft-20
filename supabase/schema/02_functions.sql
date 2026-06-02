-- ============================================================================
-- Database functions
-- All SECURITY DEFINER functions pin search_path to 'public' to prevent
-- search-path injection. Helper triggers used by table files live here too.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- update_updated_at_column
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$

;

-- ----------------------------------------------------------------------------
-- has_role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$

;

-- ----------------------------------------------------------------------------
-- handle_new_user
-- ----------------------------------------------------------------------------
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
$function$

;

-- ----------------------------------------------------------------------------
-- generate_profile_slug
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 0;
BEGIN
  IF NEW.profile_slug IS NULL AND NEW.full_name IS NOT NULL THEN
    base_slug := lower(regexp_replace(NEW.full_name, '[^a-zA-Z0-9]', '-', 'g'));
    new_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM profiles WHERE profile_slug = new_slug AND user_id != NEW.user_id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.profile_slug := new_slug;
  END IF;
  RETURN NEW;
END;
$function$

;

-- ----------------------------------------------------------------------------
-- check_message_rate_limit
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_message_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.messages
  WHERE sender_id = NEW.sender_id
    AND created_at > NOW() - INTERVAL '1 minute';
  
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 10 messages per minute';
  END IF;
  
  RETURN NEW;
END;
$function$

;

-- ----------------------------------------------------------------------------
-- update_endorsement_count
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_endorsement_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_skills SET endorsement_count = endorsement_count + 1 WHERE id = NEW.skill_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_skills SET endorsement_count = endorsement_count - 1 WHERE id = OLD.skill_id;
  END IF;
  RETURN NULL;
END;
$function$

;

-- ----------------------------------------------------------------------------
-- transfer_credits
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_credits(p_sender_id uuid, p_receiver_id uuid, p_amount integer, p_service_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  SELECT time_credits INTO v_sender_balance
  FROM profiles
  WHERE user_id = p_sender_id
  FOR UPDATE;
  
  IF v_sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender profile not found';
  END IF;
  
  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Balance: %, Required: %', v_sender_balance, p_amount;
  END IF;
  
  UPDATE profiles
  SET time_credits = time_credits - p_amount,
      updated_at = now()
  WHERE user_id = p_sender_id;
  
  UPDATE profiles
  SET time_credits = time_credits + p_amount,
      earned_credits = earned_credits + p_amount,
      updated_at = now()
  WHERE user_id = p_receiver_id;
  
  INSERT INTO transactions (sender_id, receiver_id, service_id, amount, description, status, completed_at)
  VALUES (p_sender_id, p_receiver_id, p_service_id, p_amount, p_description, 'completed', now())
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$function$

;

-- ----------------------------------------------------------------------------
-- accept_contract_with_escrow
-- ----------------------------------------------------------------------------
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
$function$

;

-- ----------------------------------------------------------------------------
-- pay_contract_stripe
-- ----------------------------------------------------------------------------
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
$function$

;

-- ----------------------------------------------------------------------------
-- cancel_contract_with_escrow
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_contract_with_escrow(p_contract_id uuid, p_user_id uuid)
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
$function$

;

-- ----------------------------------------------------------------------------
-- auto_cancel_unpaid_contracts
-- ----------------------------------------------------------------------------
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
$function$

;

-- ----------------------------------------------------------------------------
-- complete_contract
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_contract(p_contract_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

;

-- ----------------------------------------------------------------------------
-- increment_blog_view
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_blog_view(p_slug text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.blog_posts SET view_count = view_count + 1 WHERE slug = p_slug AND status = 'published';
$function$

;

-- ----------------------------------------------------------------------------
-- increment_help_view
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_help_view(p_slug text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.help_articles SET view_count = view_count + 1 WHERE slug = p_slug AND status = 'published';
$function$

;

