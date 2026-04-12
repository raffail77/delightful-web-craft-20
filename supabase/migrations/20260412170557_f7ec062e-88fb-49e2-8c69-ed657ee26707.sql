
-- Fix: Convert view to SECURITY INVOKER so RLS of querying user applies
ALTER VIEW public.profiles_public SET (security_invoker = on);
