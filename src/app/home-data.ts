import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type HomeGroup = Pick<
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

export type HomePost = Pick<
  Database["public"]["Tables"]["weekly_posts"]["Row"],
  "id" | "title" | "body_markdown" | "feedback_question" | "created_at"
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

export async function getHomeData(): Promise<HomeData> {
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

  const { data, error } = await supabase
    .from("groups")
    .select(
      "id,name,invite_code,default_meeting_day,default_meeting_time,default_location_type,default_location_name,default_location_url,default_location_note",
    )
    .order("created_at", { ascending: true });

  const groups = (data ?? []) as HomeGroup[];
  const activeGroup = groups[0] ?? null;
  let posts: HomePost[] = [];
  let postError: string | null = null;

  if (activeGroup) {
    const { data: postData, error: weeklyPostError } = await supabase
      .from("weekly_posts")
      .select(
        "id,title,body_markdown,feedback_question,created_at,author:profiles!weekly_posts_author_id_fkey(nickname),post_links(id,url,title,site_name)",
      )
      .eq("group_id", activeGroup.id)
      .order("created_at", { ascending: false })
      .limit(10);

    posts = (postData ?? []) as HomePost[];
    postError = weeklyPostError ? "공유글 정보를 불러오지 못했습니다." : null;
  }

  return {
    configured: true,
    user: {
      id: user.id,
      email: user.email ?? null,
      name:
        String(user.user_metadata.name ?? user.user_metadata.full_name ?? user.user_metadata.nickname ?? "")
          .trim() || null,
      avatarUrl: String(user.user_metadata.avatar_url ?? user.user_metadata.picture ?? "").trim() || null,
    },
    groups,
    posts,
    error: error
      ? "그룹 정보를 불러오지 못했습니다. Supabase migration 적용 여부를 확인해주세요."
      : postError,
  };
}
