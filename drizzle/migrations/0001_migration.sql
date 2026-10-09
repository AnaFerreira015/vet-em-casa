
create policy "pet photos own read" on storage.objects for select to authenticated using (
  bucket_id = 'pet-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'vet')));
create policy "pet photos own insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pet photos own update" on storage.objects for update to authenticated using (
  bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pet photos own delete" on storage.objects for delete to authenticated using (
  bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
