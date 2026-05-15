create or replace function public.transfer_group_ownership(
  target_group_id uuid,
  new_owner_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role public.group_role;
  target_role public.group_role;
begin
  if new_owner_user_id = auth.uid() then
    raise exception 'cannot transfer to self';
  end if;

  select role into requester_role
  from public.group_members
  where group_id = target_group_id
    and user_id = auth.uid();

  if requester_role is distinct from 'owner' then
    raise exception 'only owner can transfer ownership';
  end if;

  select role into target_role
  from public.group_members
  where group_id = target_group_id
    and user_id = new_owner_user_id;

  if target_role is null then
    raise exception 'new owner is not a group member';
  end if;

  update public.group_members
  set role = 'member'
  where group_id = target_group_id
    and user_id = auth.uid();

  update public.group_members
  set role = 'owner'
  where group_id = target_group_id
    and user_id = new_owner_user_id;

  update public.groups
  set created_by = new_owner_user_id
  where id = target_group_id;
end;
$$;

grant execute on function public.transfer_group_ownership(uuid, uuid) to authenticated;
