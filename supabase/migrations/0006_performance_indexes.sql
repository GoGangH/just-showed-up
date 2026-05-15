create index if not exists group_members_user_group_idx
on public.group_members (user_id, group_id);

create index if not exists group_members_group_role_idx
on public.group_members (group_id, role);

create index if not exists weekly_posts_group_week_created_idx
on public.weekly_posts (group_id, week_start desc, created_at desc);

create index if not exists weekly_posts_group_author_week_idx
on public.weekly_posts (group_id, author_id, week_start);

create index if not exists study_sessions_group_week_idx
on public.study_sessions (group_id, week_start);

create index if not exists session_time_slots_session_start_idx
on public.session_time_slots (session_id, starts_at);

create index if not exists session_availabilities_session_slot_idx
on public.session_availabilities (session_id, slot_id);

create index if not exists post_links_post_idx
on public.post_links (post_id);

create index if not exists post_attachments_post_idx
on public.post_attachments (post_id);

create index if not exists anonymous_comments_post_created_idx
on public.anonymous_comments (post_id, created_at);

create index if not exists anonymous_reactions_post_idx
on public.anonymous_reactions (post_id);
