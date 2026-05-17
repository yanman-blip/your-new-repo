-- ============ STORAGE: payment-proofs bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs');

CREATE POLICY "Anyone can upload payment proofs"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'payment-proofs');