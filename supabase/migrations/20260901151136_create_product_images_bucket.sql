/*
# Create product-images storage bucket

1. Storage
   - Create a public bucket `product-images` for admin-uploaded product photos.
   - Allow anyone to read (public bucket) so product images render on the storefront.
   - Allow authenticated users to upload (admin is authenticated).

2. Security
   - Public read: anyone can SELECT from storage.objects where bucket_id = 'product-images'.
   - Authenticated upload: only authenticated users can INSERT into storage.objects for this bucket.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_select_public" ON storage.objects;
CREATE POLICY "product_images_select_public" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_insert_authenticated" ON storage.objects;
CREATE POLICY "product_images_insert_authenticated" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_update_authenticated" ON storage.objects;
CREATE POLICY "product_images_update_authenticated" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_delete_authenticated" ON storage.objects;
CREATE POLICY "product_images_delete_authenticated" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images');
