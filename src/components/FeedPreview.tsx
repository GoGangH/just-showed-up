import { MessageCircle, Paperclip, Sparkles } from "lucide-react";
import type { HomePost } from "@/app/home-data";
import Link from "next/link";

function getExcerpt(markdown: string) {
  return markdown
    .replace(/[#>*_`-]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);
}

function formatWeekLabel(weekStart: string) {
  const date = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "주차 미정";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일 주`;
}

export function FeedPreview({ posts }: { posts: HomePost[] }) {
  const postsByWeek = posts.reduce<Map<string, HomePost[]>>((groups, post) => {
    const weekPosts = groups.get(post.week_start) ?? [];
    weekPosts.push(post);
    groups.set(post.week_start, weekPosts);
    return groups;
  }, new Map());

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-500">그룹 기록</p>
          <h2 className="mt-1 text-xl font-semibold">주차별 공유글</h2>
        </div>
      </div>

      {posts.length === 0 ? (
        <article className="rounded-lg border border-neutral-200 bg-white p-5">
          <h3 className="text-lg font-semibold">아직 공유글이 없습니다</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            이번 주 모임 전에 첫 공유글을 작성해보세요.
          </p>
        </article>
      ) : null}

      {Array.from(postsByWeek.entries()).map(([weekStart, weekPosts]) => (
        <div className="space-y-3" key={weekStart}>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-neutral-700">
              {formatWeekLabel(weekStart)}
            </h3>
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs font-semibold text-neutral-500">
              {weekPosts.length}개
            </span>
          </div>

          {weekPosts.map((post) => (
            <article className="rounded-lg border border-neutral-200 bg-white p-5" key={post.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-500">
                    {post.author?.nickname ?? "작성자"}
                  </p>
                  <Link className="mt-1 block text-lg font-semibold hover:underline" href={`/posts/${post.id}`}>
                    {post.title}
                  </Link>
                </div>
                <span className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {formatWeekLabel(post.week_start)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-700">{getExcerpt(post.body_markdown)}</p>
              {post.post_links.length > 0 ? (
                <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm">
                  <p className="inline-flex items-center gap-2 font-semibold">
                    <Paperclip size={15} />
                    {post.post_links.length}개 링크
                  </p>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-600">
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={15} />
                  익명 반응 {post.anonymous_reactions.length}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle size={15} />
                  익명 댓글 {post.anonymous_comments.length}
                </span>
              </div>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}
