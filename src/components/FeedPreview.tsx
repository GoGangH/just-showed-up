import { MessageCircle, Paperclip, Sparkles } from "lucide-react";

const posts = [
  {
    author: "민지",
    title: "Next.js 인증 흐름 정리",
    body: "Supabase 세션 처리와 middleware 구성을 정리했습니다. RLS 정책은 모임에서 함께 검토하고 싶습니다.",
    meta: "링크 1 · PDF 1",
    reactions: 6,
    comments: 3,
  },
  {
    author: "준호",
    title: "포트폴리오 소개 문장 수정",
    body: "Notion에 수정안을 정리했습니다. 모임에서 첫 문단의 흐름과 표현을 확인받고 싶습니다.",
    meta: "Notion 링크",
    reactions: 4,
    comments: 2,
  },
];

export function FeedPreview() {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-500">그룹 기록</p>
          <h2 className="mt-1 text-xl font-semibold">이번 주 공유글</h2>
        </div>
        <button className="text-sm font-semibold text-neutral-600 hover:text-neutral-900">전체 보기</button>
      </div>

      {posts.map((post) => (
        <article className="rounded-lg border border-neutral-200 bg-white p-5" key={post.title}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-neutral-500">{post.author}</p>
              <h3 className="mt-1 text-lg font-semibold">{post.title}</h3>
            </div>
            <span className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              이번 주
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{post.body}</p>
          <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm">
            <p className="inline-flex items-center gap-2 font-semibold">
              <Paperclip size={15} />
              {post.meta}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1">
              <Sparkles size={15} />
              익명 반응 {post.reactions}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={15} />
              익명 댓글 {post.comments}
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}
