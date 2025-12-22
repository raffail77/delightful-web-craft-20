-- Create enum for service type
CREATE TYPE public.service_type AS ENUM ('offer', 'request');

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  service_type service_type NOT NULL,
  hourly_credits INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  is_remote BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Everyone can view active services
CREATE POLICY "Anyone can view active services"
ON public.services
FOR SELECT
USING (is_active = true);

-- Users can create their own services
CREATE POLICY "Users can create their own services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own services
CREATE POLICY "Users can update their own services"
ON public.services
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own services
CREATE POLICY "Users can delete their own services"
ON public.services
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;