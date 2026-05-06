-- Maintain endorsement_count denormalization on user_skills
CREATE OR REPLACE FUNCTION public.update_endorsement_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_skills SET endorsement_count = endorsement_count + 1 WHERE id = NEW.skill_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_skills SET endorsement_count = endorsement_count - 1 WHERE id = OLD.skill_id;
  END IF;
  RETURN NULL;
END;
$$;
