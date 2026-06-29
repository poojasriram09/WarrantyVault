-- Allow anon key to upload, read, and delete from the 'documents' bucket.
-- This removes the need for the service-role key in the frontend.

-- Allow anyone to upload files to the documents bucket
CREATE POLICY "Allow public uploads to documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents');

-- Allow anyone to read files from the documents bucket
CREATE POLICY "Allow public reads from documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

-- Allow anyone to update files in the documents bucket
CREATE POLICY "Allow public updates in documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents');

-- Allow anyone to delete files from the documents bucket
CREATE POLICY "Allow public deletes from documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents');
