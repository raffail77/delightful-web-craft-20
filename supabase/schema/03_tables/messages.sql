CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  service_id uuid,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own sent messages" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete messages in their conversations" ON public.messages
  FOR DELETE USING (auth.uid() = receiver_id);

CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Optional: enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
