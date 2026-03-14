
-- Add image_url column to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload service images
CREATE POLICY "Users can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-images');

-- Allow public to view service images
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- Allow users to delete their own service images
CREATE POLICY "Users can delete own service images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-images' AND (storage.foldername(name))[1] = auth.uid()::text);
