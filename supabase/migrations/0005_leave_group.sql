create or replace function public.leave_group(target_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_role public.group_role;
  owner_count int;
begin
  select role into membership_role
  from public.group_members
  where group_id = target_group_id
    and user_id = auth.uid();

  if membership_role is null then
    raise exception 'not a group member';
  end if;

  if membership_role = 'owner' then
    select count(*) into owner_count
    from public.group_members
    where group_id = target_group_id
      and role = 'owner';

    if owner_count <= 1 then
      raise exception 'last owner cannot leave';
    end if;
  end if;

  delete from public.group_members
  where group_id = target_group_id
    and user_id = auth.uid();
end;
$$;

grant execute on function public.leave_group(uuid) to authenticated;
