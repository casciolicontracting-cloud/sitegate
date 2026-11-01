-- Private storage for the team's reference library: the 2024 Building Code Compendium,
-- uploaded whole and unaltered (as the Ministry's terms require for sharing), at
-- reference/obc-2024/vol1.pdf and reference/obc-2024/vol2.pdf. Only team members
-- (see 0002) can read or replace it; tasks open it at the cited page.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reference', 'reference', false, 62914560, array['application/pdf']);

create policy "team reads reference" on storage.objects for select to authenticated
  using (bucket_id = 'reference' and private.is_team());
create policy "team uploads reference" on storage.objects for insert to authenticated
  with check (bucket_id = 'reference' and private.is_team());
create policy "team replaces reference" on storage.objects for update to authenticated
  using (bucket_id = 'reference' and private.is_team()) with check (bucket_id = 'reference' and private.is_team());
create policy "team removes reference" on storage.objects for delete to authenticated
  using (bucket_id = 'reference' and private.is_team());
