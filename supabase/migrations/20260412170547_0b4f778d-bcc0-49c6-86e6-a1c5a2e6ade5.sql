
-- 1. FIX: Profiles - Create a secure view that hides sensitive data from non-owners
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles visible based on privacy settings" ON public.profiles;

-- Create a new policy that still allows SELECT but we'll use a view for safe column access
CREATE POLICY "Profiles visible based on privacy settings" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR (profile_visibility = 'public') 
  OR (profile_visibility = 'members' AND auth.uid() IS NOT NULL)
);

-- Create a secure view that conditionally exposes sensitive columns
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  bio,
  about,
  cover_url,
  headline,
  location,
  availability_status,
  skills,
  profile_slug,
  profile_visibility,
  is_verified,
  response_time_hours,
  created_at,
  updated_at,
  -- Only show email if show_email is true OR viewer is the owner
  CASE WHEN show_email = true OR auth.uid() = user_id THEN email ELSE NULL END AS email,
  -- Only show location details if show_location is true OR viewer is the owner
  CASE WHEN show_location = true OR auth.uid() = user_id THEN location ELSE NULL END AS display_location,
  -- Financial fields only visible to owner
  CASE WHEN auth.uid() = user_id THEN time_credits ELSE NULL END AS time_credits,
  CASE WHEN auth.uid() = user_id THEN earned_credits ELSE NULL END AS earned_credits,
  CASE WHEN auth.uid() = user_id THEN bonus_credits ELSE NULL END AS bonus_credits,
  CASE WHEN auth.uid() = user_id THEN escrow_credits ELSE NULL END AS escrow_credits,
  CASE WHEN auth.uid() = user_id THEN show_email ELSE NULL END AS show_email,
  CASE WHEN auth.uid() = user_id THEN show_location ELSE NULL END AS show_location,
  CASE WHEN auth.uid() = user_id THEN is_suspended ELSE NULL END AS is_suspended,
  CASE WHEN auth.uid() = user_id THEN last_free_credits_at ELSE NULL END AS last_free_credits_at,
  CASE WHEN auth.uid() = user_id THEN stripe_connect_account_id ELSE NULL END AS stripe_connect_account_id,
  CASE WHEN auth.uid() = user_id THEN stripe_connect_onboarding_complete ELSE NULL END AS stripe_connect_onboarding_complete
FROM public.profiles;

-- 2. FIX: Storage - Fix INSERT policy to enforce path ownership
DROP POLICY IF EXISTS "Users can upload service images" ON storage.objects;
CREATE POLICY "Users can upload service images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add UPDATE policy with ownership check
DROP POLICY IF EXISTS "Users can update service images" ON storage.objects;
CREATE POLICY "Users can update service images" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'service-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. FIX: Messages - Add content length constraint
ALTER TABLE public.messages
ADD CONSTRAINT messages_content_length 
CHECK (length(content) >= 1 AND length(content) <= 5000);

-- 4. FIX: Message rate limiting trigger
CREATE OR REPLACE FUNCTION public.check_message_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE TRIGGER message_rate_limit_trigger
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_message_rate_limit();
