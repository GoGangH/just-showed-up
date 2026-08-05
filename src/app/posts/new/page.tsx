import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentWeekStart } from "@/lib/dates/week";
import { buildLoginHref } from "@/lib/redirects";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { PostCreateForm } from "./PostCreateForm";

type NewPostPageProps = {
  searchParams: Promise<{
    group?: string;
    week?: string;
  }>;
};

function getSafeWeekStart(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return getCurrentWeekStart();
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? getCurrentWeekStart() : value;
}

function formatWeekStart(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 주차`;
}

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const { group, week } = await searchParams;
  const weekStart = getSafeWeekStart(week);
  let existingPost: { id: string; title: string } | null = null;

  if (group && hasSupabaseConfig()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(buildLoginHref(`/posts/new?group=${group}&week=${weekStart}`) as never);
    }

    const { data: existingPostData } = await supabase
      .from("weekly_posts")
      .select("id,title")
      .eq("group_id", group)
      .eq("author_id", user.id)
      .eq("week_start", weekStart)
      .maybeSingle();

    existingPost = existingPostData as { id: string; title: string } | null;
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-line bg-surface p-6">
        <Link className="text-sm font-semibold text-faint" href="/">
          일단옴
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">이번 주 공유 작성</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          모임 전에 공유할 진행 내용, 자료 링크, 피드백 질문을 정리합니다.
        </p>
        <p className="mt-3 inline-flex rounded-md bg-line px-3 py-1 text-xs font-semibold text-muted">
          작성 주차 · {formatWeekStart(weekStart)}
        </p>

        {!group ? (
          <div className="mt-6 rounded-md border border-sun-border bg-sun-tint p-4 text-sm leading-6 text-sun">
            그룹 정보가 없습니다. 홈에서 그룹을 선택한 뒤 다시 작성해주세요.
          </div>
        ) : existingPost ? (
          <div className="mt-6 rounded-md border border-sun-border bg-sun-tint p-4 text-sm leading-6 text-sun">
            <p className="font-semibold">이미 이 주차에 작성한 글이 있습니다.</p>
            <p className="mt-1">새 글을 하나 더 만들지 않고 기존 글을 수정합니다.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                className="rounded-md bg-accent px-4 py-2 text-center text-sm font-semibold text-inverse"
                href={`/posts/${existingPost.id}/edit`}
              >
                기존 글 수정
              </Link>
              <Link
                className="rounded-md border border-sun-border bg-surface px-4 py-2 text-center text-sm font-semibold text-sun"
                href={`/groups/${group}?week=${weekStart}`}
              >
                그룹으로 돌아가기
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <PostCreateForm groupId={group} weekStart={weekStart} />
          </div>
        )}
      </section>
    </main>
  );
}
