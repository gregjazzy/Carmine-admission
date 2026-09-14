do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'carmine_documents' and policyname = 'retirer son propre document') then
    create policy "retirer son propre document" on carmine_documents
      for delete using (uploaded_by = auth.uid() and exists (
        select 1 from carmine_student_parents sp
        where sp.student_id = carmine_documents.student_id and sp.profile_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'carmine — retirer son propre fichier') then
    create policy "carmine — retirer son propre fichier" on storage.objects
      for delete using (bucket_id = 'carmine-documents' and owner = auth.uid());
  end if;
end $$;
