insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'post-attachments',
  'post-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "post attachment owners can upload" on storage.objects;
create policy "post attachment owners can upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'post-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "group members can read post attachments" on storage.objects;
create policy "group members can read post attachments"
on storage.objects for select
to authenticated
using (
  bucket_id = 'post-attachments'
  and exists (
    select 1
    from public.post_attachments pa
    join public.weekly_posts wp on wp.id = pa.post_id
    where pa.file_path = storage.objects.name
      and public.is_group_member(wp.group_id)
  )
);

drop policy if exists "post attachment owners can delete" on storage.objects;
create policy "post attachment owners can delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'post-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);
