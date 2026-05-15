import { AppHeader } from "@/components/AppHeader";
import { PrefetchRouteLink } from "@/components/PrefetchRouteLink";
import { getHeaderNotifications } from "@/lib/notifications";
import { buildLoginHref } from "@/lib/redirects";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getProfileDisplayName } from "@/lib/profiles";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";

type MyPost = {
  id: string;
  title: string;
  body_markdown: string;
  week_start: string;
  created_at: string;
  group_id: string;
  groups: { name: string } | null;
  anonymous_comments: { id: string }[];
  anonymous_reactions: { id: string }[];
};

function formatWeek(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 주`;
}

function getExcerpt(markdown: string) {
  return markdown
    .replace(/[#>*_`-]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 140);
}

export default async function MyPostsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Supabase 환경변수를 먼저 설정해주세요.
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginHref("/me/posts") as never);
  }

  const [notificationData, postsResult] = await Promise.all([
    getHeaderNotifications(supabase, user.id),
    supabase
      .from("weekly_posts")
      .select(
        "id,title,body_markdown,week_start,created_at,group_id,groups(name),anonymous_comments(id),anonymous_reactions(id)",
      )
      .eq("author_id", user.id)
      .order("week_start", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  const posts = (postsResult.data ?? []) as MyPost[];
  const displayName = getProfileDisplayName(user) ?? user.email?.split("@")[0] ?? "사용자";
  const avatarUrl =
    String(user.user_metadata.avatar_url ?? user.user_metadata.picture ?? "").trim() || null;

  return (
    <main className="min-h-screen">
      <AppHeader
        avatarUrl={avatarUrl}
        displayName={displayName}
        isSignedIn
        notifications={notificationData.notifications}
        unreadCount={notificationData.unreadCount}
      />

      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        <PrefetchRouteLink
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
          href="/"
          prefetchOnMount
        >
          <ChevronLeft size={16} />
          스터디 목록
        </PrefetchRouteLink>

        <section className="mt-5 border-b border-neutral-200 pb-5">
          <p className="text-sm font-semibold text-neutral-500">내 기록</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">내가 올린 글</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            지금까지 작성한 주차별 공유글을 최신순으로 모아봅니다.
          </p>
        </section>

        {posts.length === 0 ? (
          <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold">아직 작성한 글이 없습니다</h2>
            <p className="mt-2 text-sm text-neutral-600">
              참여 중인 스터디에서 이번 주 기록을 작성하면 여기에 표시됩니다.
            </p>
          </section>
        ) : (
          <section className="mt-6 grid gap-3">
            {posts.map((post) => (
              <PrefetchRouteLink
                className="block rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
                href={`/posts/${post.id}?from=${encodeURIComponent("/me/posts")}`}
                key={post.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-500">
                      {post.groups?.name ?? "스터디"} · {formatWeek(post.week_start)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-neutral-900">{post.title}</h2>
                  </div>
                  <p className="text-sm text-neutral-500">
                    {new Date(post.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {getExcerpt(post.body_markdown)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-neutral-500">
                  <span>익명 댓글 {post.anonymous_comments.length}</span>
                  <span>익명 반응 {post.anonymous_reactions.length}</span>
                </div>
              </PrefetchRouteLink>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
