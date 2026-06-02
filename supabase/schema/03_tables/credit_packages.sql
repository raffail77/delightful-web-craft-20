CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_usd numeric NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  stripe_price_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.credit_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_packages TO authenticated;
GRANT ALL ON public.credit_packages TO service_role;

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage packages" ON public.credit_packages
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active packages" ON public.credit_packages
  FOR SELECT
  USING ((is_active = true));
