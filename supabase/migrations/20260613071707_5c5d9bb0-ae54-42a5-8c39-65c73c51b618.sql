DROP POLICY IF EXISTS "Admins can write test bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update test bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete test bucket" ON storage.objects;

CREATE POLICY "Admins can write test bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'test' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update test bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'test' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'test' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete test bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'test' AND public.has_role(auth.uid(), 'admin'));