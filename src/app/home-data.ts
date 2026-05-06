import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWeekStart } from "@/lib/dates/week";
import type { Database } from "@/lib/supabase/database.types";

export type HomeMember = {
  userId: string;
  nickname: string;
  postedThisWeek: boolean;
  role: "owner" | "member";
};

export type HomeGroupBase = Pick<
  Database["public"]["Tables"]["groups"]["Row"],
  | "id"
  | "name"
  | "invite_code"
  | "default_meeting_day"
  | "default_meeting_time"
  | "default_location_type"
  | "default_location_name"
  | "default_location_url"
  | "default_location_note"
>;

export type HomeGroup = HomeGroupBase & {
  currentUserRole: "owner" | "member" | null;
  members: HomeMember[];
};

export type HomePost = Pick<
  Database["public"]["Tables"]["weekly_posts"]["Row"],
  | "id"
  | "title"
  | "body_markdown"
  | "feedback_question"
  | "created_at"
  | "author_id"
  | "week_start"
> & {
  author: {
    nickname: string;
  } | null;
  post_links: {
    id: string;
    url: string;
    title: string | null;
    site_name: string | null;
  }[];
  anonymous_comments: { id: string }[];
  anonymous_reactions: { id: string }[];
};

export type HomeData =
  | {
      configured: false;
      user: null;
      groups: HomeGroup[];
      posts: HomePost[];
      error: null;
    }
  | {
      configured: true;
      user: { id: string; email: string | null; name: string | null; avatarUrl: string | null };
      groups: HomeGroup[];
      posts: HomePost[];
      error: string | null;
    }
  | {
      configured: true;
      user: null;
      groups: HomeGroup[];
      posts: HomePost[];
      error: string | null;
    };

export async function getHomeData(activeGroupId?: string): Promise<HomeData> {
  if (!hasSupabaseConfig()) {
    return {
      configured: false,
      user: null,
      groups: [],
      posts: [],
      error: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      configured: true,
      user: null,
      groups: [],
      posts: [],
      error: null,
    };
  }

  const profileName =
    String(user.user_metadata.name ?? user.user_metadata.full_name ?? user.user_metadata.nickname ?? "")
      .trim() ||
    user.email?.split("@")[0] ||
    "사용자";

  await supabase.from("profiles").upsert({
    id: user.id,
    nickname: profileName.slice(0, 30),
  } as never);

  const { data, error } = await supabase
    .from("groups")
    .select(
      "id,name,invite_code,default_meeting_day,default_meeting_time,default_location_type,default_location_name,default_location_url,default_location_note",
    )
    .order("created_at", { ascending: true });

  const groupBases = (data ?? []) as HomeGroupBase[];
  const groupIds = groupBases.map((group) => group.id);
  let groups: HomeGroup[] = groupBases.map((group) => ({
    ...group,
    currentUserRole: null,
    members: [],
  }));

  if (groupIds.length > 0) {
    const { data: memberRows } = await supabase
      .from("group_members")
      .select("group_id,user_id,role")
      .in("group_id", groupIds);

    const members = (memberRows ?? []) as {
      group_id: string;
      role: "owner" | "member";
      user_id: string;
    }[];
    const userIds = Array.from(new Set(members.map((member) => member.user_id)));

    const { data: profileRows } =
      userIds.length > 0
        ? await supabase.from("profiles").select("id,nickname").in("id", userIds)
        : { data: [] };

    const profiles = new Map(
      ((profileRows ?? []) as { id: string; nickname: string }[]).map((profile) => [
        profile.id,
        profile.nickname,
      ]),
    );

    const { data: weeklyPostRows } = await supabase
      .from("weekly_posts")
      .select("group_id,author_id")
      .in("group_id", groupIds)
      .eq("week_start", getCurrentWeekStart());

    const postedKeys = new Set(
      ((weeklyPostRows ?? []) as { group_id: string; author_id: string }[]).map(
        (post) => `${post.group_id}:${post.author_id}`,
      ),
    );

    groups = groupBases.map((group) => ({
      ...group,
      currentUserRole:
        members.find((member) => member.group_id === group.id && member.user_id === user.id)?.role ??
        null,
      members: members
        .filter((member) => member.group_id === group.id)
        .map((member) => ({
          userId: member.user_id,
          nickname: profiles.get(member.user_id) ?? "멤버",
          postedThisWeek: postedKeys.has(`${group.id}:${member.user_id}`),
          role: member.role,
        })),
    }));
  }

  const activeGroup = activeGroupId
    ? groups.find((group) => group.id === activeGroupId) ?? null
    : null;
  let posts: HomePost[] = [];
  let postError: string | null = null;

  if (activeGroup) {
    const { data: postData, error: weeklyPostError } = await supabase
      .from("weekly_posts")
      .select(
        "id,title,body_markdown,feedback_question,created_at,author_id,week_start,post_links(id,url,title,site_name),anonymous_comments(id),anonymous_reactions(id)",
      )
      .eq("group_id", activeGroup.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const rows = (postData ?? []) as Omit<HomePost, "author">[];
    const authorIds = Array.from(new Set(rows.map((post) => post.author_id)));
    const { data: authorRows } =
      authorIds.length > 0
        ? await supabase.from("profiles").select("id,nickname").in("id", authorIds)
        : { data: [] };
    const authors = new Map(
      ((authorRows ?? []) as { id: string; nickname: string }[]).map((author) => [
        author.id,
        author.nickname,
      ]),
    );

    posts = rows.map((post) => ({
      ...post,
      author: { nickname: authors.get(post.author_id) ?? "작성자" },
    }));
    postError = weeklyPostError
      ? `공유글 정보를 불러오지 못했습니다. ${weeklyPostError.message}`
      : null;
  }

  return {
    configured: true,
    user: {
      id: user.id,
      email: user.email ?? null,
      name: profileName,
      avatarUrl: String(user.user_metadata.avatar_url ?? user.user_metadata.picture ?? "").trim() || null,
    },
    groups,
    posts,
    error: error
      ? "그룹 정보를 불러오지 못했습니다. Supabase migration 적용 여부를 확인해주세요."
      : postError,
  };
}
