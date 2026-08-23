CREATE POLICY "notes_pdfs_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = (select id from storage.buckets where name = 'notes-pdfs'));

CREATE POLICY "notes_pdfs_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = (select id from storage.buckets where name = 'notes-pdfs')
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = (select id from storage.buckets where name = 'notes-pdfs')
    AND public.has_role(auth.uid(), 'admin')
  );