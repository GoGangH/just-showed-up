do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum (
      'weekly_post_created',
      'anonymous_comment_created',
      'reschedule_vote_needed',
      'schedule_confirmed'
    );
  end if;
end $$;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type public.notification_type not null,
  title text not null,
  body text,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "users can read their notifications"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy "users can mark their notifications read"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "members can create notifications"
on public.notifications for insert
to authenticated
with check (
  (actor_id is null or actor_id = auth.uid())
  and (
    group_id is null
    or (
      public.is_group_member(group_id)
      and exists (
        select 1
        from public.group_members recipients
        where recipients.group_id = notifications.group_id
          and recipients.user_id = notifications.user_id
      )
    )
  )
);

create index notifications_user_unread_created_idx
on public.notifications (user_id, read_at, created_at desc);
