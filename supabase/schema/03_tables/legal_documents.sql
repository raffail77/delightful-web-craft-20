CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  version text DEFAULT '1.0'::text NOT NULL,
  updated_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.legal_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage legal" ON public.legal_documents
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone view legal" ON public.legal_documents
  FOR SELECT
  USING (true);

CREATE TRIGGER trg_legal_documents_updated
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
