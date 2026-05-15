
-- Replace permissive INSERT-true on orders with a real check (positive total)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    total >= 0
    AND payload IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Restrict bucket listing: keep public read of individual files via getPublicUrl
-- (the public bucket URL still works), but block the broad listing policy.
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Authenticated can read product images metadata"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-images');
-- Note: the bucket remains public=true, so unauthenticated visitors can still
-- load images by their direct CDN URL (used in <img src=...>); they just
-- cannot list the bucket contents.

-- Lock down has_role: only signed-in users may execute it
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- handle_new_user is only invoked by the auth trigger, never directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
