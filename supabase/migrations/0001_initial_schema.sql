create extension if not exists "pgcrypto";

create type public.location_type as enum ('online', 'offline', 'hybrid', 'unset');
create type public.group_role as enum ('owner', 'member');
create type public.session_status as enum ('scheduled', 'rescheduling', 'confirmed', 'cancelled', 'completed');
create type public.reaction_type as enum ('helpful', 'relate', 'cheer', 'curious', 'join');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  default_meeting_day int check (default_meeting_day between 0 and 6),
  default_meeting_time time,
  default_location_type public.location_type not null default 'unset',
  default_location_name text,
  default_location_url text,
  default_location_note text,
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  role public.group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  week_start date not null,
  scheduled_at timestamptz,
  status public.session_status not null default 'scheduled',
  location_type public.location_type not null default 'unset',
  location_name text,
  location_url text,
  location_note text,
  reschedule_requested_by uuid references auth.users(id) on delete set null,
  reschedule_reason text,
  created_at timestamptz not null default now(),
  unique (group_id, week_start)
);

create table public.session_time_slots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.session_availabilities (
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  slot_id uuid not null references public.session_time_slots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (slot_id, user_id)
);

create table public.weekly_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  session_id uuid references public.study_sessions(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  week_start date not null,
  title text not null check (char_length(title) between 1 and 120),
  body_markdown text not null default '',
  feedback_question text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_links (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.weekly_posts(id) on delete cascade,
  url text not null,
  title text,
  description text,
  image_url text,
  site_name text,
  created_at timestamptz not null default now()
);

create table public.post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.weekly_posts(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now()
);

-- Deliberately no author_id/user_id. The product promise depends on this table shape.
create table public.anonymous_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.weekly_posts(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Deliberately no author_id/user_id. Multiple reactions from one person are possible by design.
create table public.anonymous_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.weekly_posts(id) on delete cascade,
  reaction_type public.reaction_type not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nickname', ''),
      split_part(new.email, '@', 1),
      '사용자'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.join_group_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
begin
  select id into target_group_id
  from public.groups
  where invite_code = code;

  if target_group_id is null then
    raise exception 'invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return target_group_id;
end;
$$;

create or replace function public.add_group_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (group_id, user_id) do nothing;

  return new;
end;
$$;

create trigger on_group_created_add_owner
after insert on public.groups
for each row execute function public.add_group_owner_membership();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.study_sessions enable row level security;
alter table public.session_time_slots enable row level security;
alter table public.session_availabilities enable row level security;
alter table public.weekly_posts enable row level security;
alter table public.post_links enable row level security;
alter table public.post_attachments enable row level security;
alter table public.anonymous_comments enable row level security;
alter table public.anonymous_reactions enable row level security;

create policy "profiles are visible to authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "users can manage their profile"
on public.profiles for all
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "members can read their groups"
on public.groups for select
to authenticated
using (public.is_group_member(id));

create policy "authenticated users can create groups"
on public.groups for insert
to authenticated
with check (created_by = auth.uid());

create policy "owners can update groups"
on public.groups for update
to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = id and gm.user_id = auth.uid() and gm.role = 'owner'
  )
);

create policy "members can read group membership"
on public.group_members for select
to authenticated
using (public.is_group_member(group_id));

create policy "members can read sessions"
on public.study_sessions for select
to authenticated
using (public.is_group_member(group_id));

create policy "members can manage sessions"
on public.study_sessions for all
to authenticated
using (public.is_group_member(group_id))
with check (public.is_group_member(group_id));

create policy "members can read time slots"
on public.session_time_slots for select
to authenticated
using (
  exists (
    select 1 from public.study_sessions ss
    where ss.id = session_id and public.is_group_member(ss.group_id)
  )
);

create policy "members can manage time slots"
on public.session_time_slots for all
to authenticated
using (
  exists (
    select 1 from public.study_sessions ss
    where ss.id = session_id and public.is_group_member(ss.group_id)
  )
)
with check (
  exists (
    select 1 from public.study_sessions ss
    where ss.id = session_id and public.is_group_member(ss.group_id)
  )
);

create policy "members can read availability counts"
on public.session_availabilities for select
to authenticated
using (
  exists (
    select 1 from public.study_sessions ss
    where ss.id = session_id and public.is_group_member(ss.group_id)
  )
);

create policy "users can manage their availability"
on public.session_availabilities for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "members can read weekly posts"
on public.weekly_posts for select
to authenticated
using (public.is_group_member(group_id));

create policy "members can create weekly posts"
on public.weekly_posts for insert
to authenticated
with check (author_id = auth.uid() and public.is_group_member(group_id));

create policy "authors can update weekly posts"
on public.weekly_posts for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid() and public.is_group_member(group_id));

create policy "authors can delete weekly posts"
on public.weekly_posts for delete
to authenticated
using (author_id = auth.uid());

create policy "members can read post links"
on public.post_links for select
to authenticated
using (
  exists (
    select 1 from public.weekly_posts wp
    where wp.id = post_id and public.is_group_member(wp.group_id)
  )
);

create policy "post authors can manage links"
on public.post_links for all
to authenticated
using (
  exists (
    select 1 from public.weekly_posts wp
    where wp.id = post_id and wp.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.weekly_posts wp
    where wp.id = post_id and wp.author_id = auth.uid()
  )
);

create policy "members can read attachments"
on public.post_attachments for select
to authenticated
using (
  exists (
    select 1 from public.weekly_posts wp
    where wp.id = post_id and public.is_group_member(wp.group_id)
  )
);

create policy "post authors can manage attachments"
on public.post_attachments for all
to authenticated
using (
  exists (
    select 1 from public.weekly_posts wp
    where wp.id = post_id and wp.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.weekly_posts wp
    where wp.id = post_id and wp.author_id = auth.uid()
  )
);

create policy "members can read anonymous comments"
on public.anonymous_comments for select
to authenticated
using (
  exists (
    select 1
    from public.weekly_posts wp
    where wp.id = post_id and public.is_group_member(wp.group_id)
  )
);

create policy "members can create anonymous comments"
on public.anonymous_comments for insert
to authenticated
with check (
  exists (
    select 1
    from public.weekly_posts wp
    where wp.id = post_id and public.is_group_member(wp.group_id)
  )
);

create policy "members can read anonymous reactions"
on public.anonymous_reactions for select
to authenticated
using (
  exists (
    select 1
    from public.weekly_posts wp
    where wp.id = post_id and public.is_group_member(wp.group_id)
  )
);

create policy "members can create anonymous reactions"
on public.anonymous_reactions for insert
to authenticated
with check (
  exists (
    select 1
    from public.weekly_posts wp
    where wp.id = post_id and public.is_group_member(wp.group_id)
  )
);
