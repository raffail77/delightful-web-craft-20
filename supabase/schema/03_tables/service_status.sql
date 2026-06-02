CREATE TABLE public.service_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text DEFAULT 'operational'::text NOT NULL,
  uptime_percentage numeric DEFAULT 100 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.service_status TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_status TO authenticated;
GRANT ALL ON public.service_status TO service_role;

ALTER TABLE public.service_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage service status" ON public.service_status
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone view service status" ON public.service_status
  FOR SELECT
  USING (true);

CREATE TRIGGER trg_service_status_updated
  BEFORE UPDATE ON public.service_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
