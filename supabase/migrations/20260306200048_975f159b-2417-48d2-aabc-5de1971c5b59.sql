-- Platform settings for admin configuration
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.platform_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Credit packages
CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_usd numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  stripe_price_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packages" ON public.credit_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage packages" ON public.credit_packages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Credit purchases
CREATE TABLE public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid REFERENCES public.credit_packages(id),
  credits integer NOT NULL,
  amount_usd numeric(10,2) NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON public.credit_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON public.credit_purchases FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Withdrawal requests
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credits_amount integer NOT NULL,
  usd_amount numeric(10,2) NOT NULL,
  fee_amount numeric(10,2) NOT NULL DEFAULT 0,
  net_amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  notes text
);
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawals" ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawal_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add earned/bonus/escrow tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS earned_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_credits integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS escrow_credits integer NOT NULL DEFAULT 0;

-- Insert default credit packages
INSERT INTO public.credit_packages (name, credits, price_usd, sort_order) VALUES
  ('Starter', 5, 10.00, 1),
  ('Basic', 10, 19.00, 2),
  ('Popular', 25, 45.00, 3),
  ('Pro', 50, 85.00, 4),
  ('Enterprise', 100, 160.00, 5);

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('credit_value_usd', '"2.00"'),
  ('payout_rate_usd', '"1.50"'),
  ('withdrawal_fee_percent', '"5"'),
  ('platform_commission_percent', '"10"'),
  ('min_withdrawal_credits', '"10"');