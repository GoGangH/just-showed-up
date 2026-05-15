create or replace function public.delete_group(target_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role public.group_role;
begin
  select role into requester_role
  from public.group_members
  where group_id = target_group_id
    and user_id = auth.uid();

  if requester_role is distinct from 'owner' then
    raise exception 'only owner can delete group';
  end if;

  delete from public.groups
  where id = target_group_id;
end;
$$;

grant execute on function public.delete_group(uuid) to authenticated;

drop policy if exists "group owners can delete post attachments" on storage.objects;
create policy "group owners can delete post attachments"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'post-attachments'
  and exists (
    select 1
    from public.post_attachments pa
    join public.weekly_posts wp on wp.id = pa.post_id
    join public.group_members gm on gm.group_id = wp.group_id
    where pa.file_path = storage.objects.name
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
);
