-- Public bucket for service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Service images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can upload service images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'service-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own service images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'service-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own service images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'service-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
