alter type public.notification_type add value if not exists 'reschedule_vote_completed';

create table if not exists public.session_responses (
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table public.session_responses enable row level security;

create policy "members can read session responses"
on public.session_responses for select
to authenticated
using (
  exists (
    select 1
    from public.study_sessions sessions
    where sessions.id = session_responses.session_id
      and public.is_group_member(sessions.group_id)
  )
);

create policy "members can upsert their session responses"
on public.session_responses for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.study_sessions sessions
    where sessions.id = session_responses.session_id
      and public.is_group_member(sessions.group_id)
  )
);

create policy "members can update their session responses"
on public.session_responses for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.study_sessions sessions
    where sessions.id = session_responses.session_id
      and public.is_group_member(sessions.group_id)
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.study_sessions sessions
    where sessions.id = session_responses.session_id
      and public.is_group_member(sessions.group_id)
  )
);

create index if not exists session_responses_session_idx
on public.session_responses (session_id, updated_at desc);
