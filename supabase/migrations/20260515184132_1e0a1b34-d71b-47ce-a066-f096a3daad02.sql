
-- Drop the broad SELECT on storage.objects for product-images.
-- The bucket is public=true, so getPublicUrl()/CDN reads still work for end users.
DROP POLICY IF EXISTS "Authenticated can read product images metadata" ON storage.objects;
