CREATE OR REPLACE FUNCTION public.transfer_credits(
  p_sender_id uuid,
  p_receiver_id uuid,
  p_amount integer,
  p_service_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  SELECT time_credits INTO v_sender_balance
  FROM profiles WHERE user_id = p_sender_id FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender profile not found';
  END IF;
  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Balance: %, Required: %', v_sender_balance, p_amount;
  END IF;

  UPDATE profiles SET time_credits = time_credits - p_amount, updated_at = now()
  WHERE user_id = p_sender_id;

  UPDATE profiles SET time_credits = time_credits + p_amount,
                      earned_credits = earned_credits + p_amount,
                      updated_at = now()
  WHERE user_id = p_receiver_id;

  INSERT INTO transactions (sender_id, receiver_id, service_id, amount, description, status, completed_at)
  VALUES (p_sender_id, p_receiver_id, p_service_id, p_amount, p_description, 'completed', now())
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;
