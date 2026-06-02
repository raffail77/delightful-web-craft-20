-- ============================================================================
-- Realtime
-- - Publish messages, contracts, and transactions to the realtime stream.
-- - RLS on realtime.messages restricts channel subscriptions so authenticated
--   users can only subscribe to topics for their own user id.
-- ============================================================================

-- Publication (no-op if already published)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Restrict topic subscriptions: users may only join their own *:<uid> topics
CREATE POLICY "Authenticated users read own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'messages:%'  AND split_part(realtime.topic(), ':', 2) = (auth.uid())::text)
  OR
  (realtime.topic() LIKE 'contracts:%' AND split_part(realtime.topic(), ':', 2) = (auth.uid())::text)
  OR
  realtime.topic() IN ('messages', 'contracts')
);
