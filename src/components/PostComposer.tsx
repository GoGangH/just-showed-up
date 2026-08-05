import { FileUp, Link2, PenLine } from "lucide-react";
import Link from "next/link";

export function PostComposer({ groupId }: { groupId: string }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-faint">내 기록</p>
          <h2 className="mt-2 text-xl font-semibold">이번 주 공유 작성</h2>
        </div>
        <span className="rounded-md bg-line px-3 py-1 text-xs font-semibold text-muted">
          초안
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-sm leading-6 text-muted">
          Markdown 본문, 공유 링크, 피드백 질문을 한 번에 정리할 수 있습니다.
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <span className="inline-flex items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-ink">
          <PenLine size={16} /> 미리보기
        </span>
        <span className="inline-flex items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-ink">
          <Link2 size={16} /> 링크 추가
        </span>
        <span className="inline-flex items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-ink">
          <FileUp size={16} /> PDF/이미지
        </span>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-inverse"
          href={`/posts/new?group=${groupId}`}
        >
          작성 화면 열기
        </Link>
      </div>
    </section>
  );
}
