CREATE TABLE public.user_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language text NOT NULL,
  proficiency text NOT NULL DEFAULT 'conversational',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view languages" ON public.user_languages FOR SELECT USING (true);
CREATE POLICY "Users can manage their own languages" ON public.user_languages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own languages" ON public.user_languages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own languages" ON public.user_languages
  FOR DELETE USING (auth.uid() = user_id);
