-- ============================================================================
-- Storage buckets and policies
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('service-images',   'service-images',   true),
  ('blog-thumbnails',  'blog-thumbnails',  true),
  ('media-kit',        'media-kit',        true),
  ('resumes',          'resumes',          false)
ON CONFLICT (id) DO NOTHING;

-- --------------------------- service-images ---------------------------------
CREATE POLICY "Service images individually accessible" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'service-images');

CREATE POLICY "Users can upload service images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-images'
              AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can update service images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'service-images'
         AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can delete own service images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'service-images'
         AND (storage.foldername(name))[1] = (auth.uid())::text);

-- --------------------------- blog-thumbnails --------------------------------
CREATE POLICY "Public read blog thumbs" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-thumbnails');

CREATE POLICY "Admin write blog thumbs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-thumbnails'
              AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update blog thumbs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-thumbnails'
         AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete blog thumbs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-thumbnails'
         AND has_role(auth.uid(), 'admin'::app_role));

-- --------------------------- media-kit --------------------------------------
CREATE POLICY "Public read media kit" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-kit');

CREATE POLICY "Admin write media kit" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media-kit'
              AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update media kit" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media-kit'
         AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete media kit" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media-kit'
         AND has_role(auth.uid(), 'admin'::app_role));

-- --------------------------- resumes (private) ------------------------------
CREATE POLICY "Authenticated users upload resumes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin read resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resumes'
         AND has_role(auth.uid(), 'admin'::app_role));
