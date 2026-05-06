-- Rate-limit message sending: max 10 per minute per sender
CREATE OR REPLACE FUNCTION public.check_message_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE recent_count INTEGER;
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
$$;
