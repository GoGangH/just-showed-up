import { MessageCircle, Paperclip, Sparkles } from "lucide-react";

const posts = [
  {
    author: "민지",
    title: "Next.js 인증 흐름 정리했음",
    body: "Supabase 세션 처리랑 middleware 쪽을 정리했고, 아직 RLS 정책은 더 봐야 함.",
    meta: "링크 1 · PDF 1",
    reactions: 6,
    comments: 3,
  },
  {
    author: "준호",
    title: "포트폴리오 문장 갈아엎었음",
    body: "노션에 정리한 링크를 올려뒀고 모임 때 첫 문단이 어색한지 봐줬으면 함.",
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
          <p className="text-sm font-semibold text-berry">그룹 공유</p>
          <h2 className="mt-1 text-xl font-bold">이번 주 올라온 기록</h2>
        </div>
        <button className="text-sm font-semibold text-neutral-600">전체 보기</button>
      </div>

      {posts.map((post) => (
        <article className="rounded-lg border border-line bg-white p-5 shadow-soft" key={post.title}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-neutral-500">{post.author}</p>
              <h3 className="mt-1 text-lg font-bold">{post.title}</h3>
            </div>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-neutral-600">
              이번 주
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{post.body}</p>
          <div className="mt-4 rounded-md border border-line bg-paper p-3 text-sm">
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
