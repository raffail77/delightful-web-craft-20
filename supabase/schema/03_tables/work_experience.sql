CREATE TABLE public.work_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.work_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view work experience" ON public.work_experience FOR SELECT USING (true);
CREATE POLICY "Users can manage their own experience" ON public.work_experience
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own experience" ON public.work_experience
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own experience" ON public.work_experience
  FOR DELETE USING (auth.uid() = user_id);
