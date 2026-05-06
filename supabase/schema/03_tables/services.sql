CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  service_type public.service_type NOT NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'credits',
  hourly_credits integer NOT NULL DEFAULT 1,
  location text,
  is_remote boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create their own services" ON public.services
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" ON public.services
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" ON public.services
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all services" ON public.services
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any service" ON public.services
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any service" ON public.services
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
