import Link from "next/link";
import { getCurrentWeekStart } from "@/lib/dates/week";
import { PostCreateForm } from "./PostCreateForm";

type NewPostPageProps = {
  searchParams: Promise<{
    group?: string;
  }>;
};

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const { group } = await searchParams;

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-neutral-200 bg-white p-6">
        <Link className="text-sm font-semibold text-neutral-500" href="/">
          일단옴
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">이번 주 공유 작성</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          모임 전에 공유할 진행 내용, 자료 링크, 피드백 질문을 정리합니다.
        </p>

        {!group ? (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            그룹 정보가 없습니다. 홈에서 그룹을 선택한 뒤 다시 작성해주세요.
          </div>
        ) : (
          <div className="mt-6">
            <PostCreateForm groupId={group} weekStart={getCurrentWeekStart()} />
          </div>
        )}
      </section>
    </main>
  );
}
