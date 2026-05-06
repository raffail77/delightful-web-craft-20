CREATE TABLE public.user_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_name text NOT NULL,
  proficiency_level integer DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user tools" ON public.user_tools FOR SELECT USING (true);
CREATE POLICY "Users can manage their own tools" ON public.user_tools
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tools" ON public.user_tools
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tools" ON public.user_tools
  FOR DELETE USING (auth.uid() = user_id);
