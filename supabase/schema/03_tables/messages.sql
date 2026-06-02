-- Direct messages with rate-limit trigger and realtime publication
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  service_id uuid,
  content text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);
CREATE INDEX idx_messages_receiver ON public.messages USING btree (receiver_id);
CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);

GRANT SELECT ON public.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete messages in their conversations" ON public.messages
  FOR DELETE
  USING ((auth.uid() = receiver_id));

CREATE POLICY "Users can delete their own sent messages" ON public.messages
  FOR DELETE
  USING ((auth.uid() = sender_id));

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT
  WITH CHECK ((auth.uid() = sender_id));

CREATE POLICY "Users can update their received messages" ON public.messages
  FOR UPDATE
  USING ((auth.uid() = receiver_id));

CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT
  USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));

CREATE TRIGGER message_rate_limit_trigger
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION check_message_rate_limit();
