-- Allow users to delete their own sent messages (unsend)
CREATE POLICY "Users can delete their own sent messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = sender_id);

-- Allow users to delete messages from their conversations (for delete chat)
CREATE POLICY "Users can delete messages in their conversations" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = receiver_id);