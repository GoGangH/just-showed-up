import { FileUp, Link2, PenLine } from "lucide-react";

export function PostComposer() {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-berry">내 공유</p>
          <h2 className="mt-2 text-xl font-bold">모임 전에 이번 주 기록 남기기</h2>
        </div>
        <span className="rounded-full bg-sun/20 px-3 py-1 text-xs font-semibold text-neutral-700">
          초안
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <input
          className="w-full rounded-md border border-line bg-paper px-4 py-3 outline-none focus:border-ink"
          placeholder="제목: 이번 주는 뭐라도 했음"
        />
        <textarea
          className="min-h-36 w-full resize-y rounded-md border border-line bg-paper px-4 py-3 outline-none focus:border-ink"
          placeholder={"Markdown으로 적어보세요.\n\n- 이번 주 한 것\n- 막힌 것\n- 모임에서 묻고 싶은 것"}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold">
          <PenLine size={16} /> 미리보기
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold">
          <Link2 size={16} /> 링크 추가
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold">
          <FileUp size={16} /> PDF/이미지
        </button>
      </div>
    </section>
  );
}
