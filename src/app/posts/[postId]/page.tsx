import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import type { Database } from "@/lib/supabase/database.types";
import { CommentForm } from "./CommentForm";
import { getReactionLabel, ReactionBar } from "./ReactionBar";

type PageProps = {
  params: Promise<{
    postId: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
};

type PostDetail = Database["public"]["Tables"]["weekly_posts"]["Row"] & {
  author: { nickname: string } | null;
  post_links: Database["public"]["Tables"]["post_links"]["Row"][];
  post_attachments: Database["public"]["Tables"]["post_attachments"]["Row"][];
  anonymous_comments: Database["public"]["Tables"]["anonymous_comments"]["Row"][];
  anonymous_reactions: Pick<
    Database["public"]["Tables"]["anonymous_reactions"]["Row"],
    "id" | "reaction_type"
  >[];
};

function countReactions(post: PostDetail) {
  return post.anonymous_reactions.reduce<Record<string, number>>((acc, reaction) => {
    acc[reaction.reaction_type] = (acc[reaction.reaction_type] ?? 0) + 1;
    return acc;
  }, {});
}

function safeInternalHref(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

function formatFileSize(value: number) {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(value / 1024))}KB`;
}

function getInlineAttachmentIds(content: string) {
  return new Set(
    Array.from(content.matchAll(/attachment:([0-9a-f-]{36})/gi)).map((match) => match[1]),
  );
}

export default async function PostDetailPage({ params, searchParams }: PageProps) {
  const { postId } = await params;
  const { from } = await searchParams;

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
  const { data, error } = await supabase
    .from("weekly_posts")
    .select(
      "*,post_links(*),post_attachments(*),anonymous_comments(*),anonymous_reactions(id,reaction_type)",
    )
    .eq("id", postId)
    .single();

  if (error || !data) {
    notFound();
  }

  const postData = data as Omit<PostDetail, "author">;
  const { data: authorData } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", postData.author_id)
    .maybeSingle();
  const author = authorData as { nickname: string } | null;
  const post: PostDetail = {
    ...postData,
    author,
  };
  const isAuthor = user?.id === post.author_id;
  const reactionCounts = countReactions(post);
  const backHref = safeInternalHref(from) ?? `/groups/${post.group_id}?week=${post.week_start}`;
  const imageAttachments = post.post_attachments.filter((attachment) =>
    attachment.file_type.startsWith("image/"),
  );
  const pdfAttachments = post.post_attachments.filter(
    (attachment) => attachment.file_type === "application/pdf",
  );
  const signedAttachments = await Promise.all(
    post.post_attachments.map(async (attachment) => {
      const { data: signedData } = await supabase.storage
        .from("post-attachments")
        .createSignedUrl(attachment.file_path, 60 * 30);

      return {
        ...attachment,
        signedUrl: signedData?.signedUrl ?? null,
      };
    }),
  );
  const signedImages = signedAttachments.filter((attachment) =>
    imageAttachments.some((image) => image.id === attachment.id),
  );
  const signedPdfs = signedAttachments.filter((attachment) =>
    pdfAttachments.some((pdf) => pdf.id === attachment.id),
  );
  const inlineAttachmentIds = getInlineAttachmentIds(post.body_markdown);
  const signedImageById = new Map(
    signedImages
      .filter((image) => image.signedUrl)
      .map((image) => [image.id, image.signedUrl as string]),
  );
  const bodyMarkdown = post.body_markdown.replace(
    /attachment:([0-9a-f-]{36})/gi,
    (match, attachmentId: string) => signedImageById.get(attachmentId) ?? match,
  );
  const unattachedImages = signedImages.filter((image) => !inlineAttachmentIds.has(image.id));

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link className="text-sm font-semibold text-neutral-500 hover:text-neutral-900" href={backHref as never}>
            이전으로
          </Link>
          {isAuthor ? (
            <Link
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
              href={`/posts/${post.id}/edit`}
            >
              수정
            </Link>
          ) : null}
        </div>

        <article className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm font-semibold text-neutral-500">
            {post.author?.nickname ?? "작성자"} · {post.week_start}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">{post.title}</h1>

          {post.feedback_question ? (
            <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6">
              <p className="font-semibold text-neutral-900">피드백 받고 싶은 질문</p>
              <p className="mt-1 text-neutral-700">{post.feedback_question}</p>
            </div>
          ) : null}

          <div className="mt-6">
            <MarkdownViewer content={bodyMarkdown} />
          </div>

          {post.post_links.length > 0 ? (
            <section className="mt-6 space-y-2">
              <h2 className="text-sm font-semibold text-neutral-500">공유 링크</h2>
              {post.post_links.map((link) => (
                <a
                  className="block rounded-md border border-neutral-200 bg-neutral-50 p-4 hover:border-neutral-300"
                  href={link.url}
                  key={link.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <p className="font-semibold text-neutral-900">{link.title ?? link.url}</p>
                  {link.description ? (
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{link.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs font-medium text-neutral-500">
                    {link.site_name ?? new URL(link.url).hostname}
                  </p>
                </a>
              ))}
            </section>
          ) : null}

          {unattachedImages.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-neutral-500">본문에 넣지 않은 이미지</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {unattachedImages.map((image) =>
                  image.signedUrl ? (
                    <a
                      className="block overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50"
                      href={image.signedUrl}
                      key={image.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <img
                        alt={image.file_name}
                        className="aspect-video w-full object-cover"
                        src={image.signedUrl}
                      />
                      <p className="truncate px-3 py-2 text-xs font-medium text-neutral-600">
                        {image.file_name}
                      </p>
                    </a>
                  ) : null,
                )}
              </div>
            </section>
          ) : null}

          {signedPdfs.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-neutral-500">첨부 PDF</h2>
              <div className="mt-3 space-y-2">
                {signedPdfs.map((pdf) =>
                  pdf.signedUrl ? (
                    <a
                      className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 hover:border-neutral-300"
                      href={pdf.signedUrl}
                      key={pdf.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-neutral-700">
                          <FileText size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-neutral-900">
                            {pdf.file_name}
                          </span>
                          <span className="mt-1 block text-xs text-neutral-500">
                            PDF · {formatFileSize(pdf.file_size)}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-neutral-600">열기</span>
                    </a>
                  ) : null,
                )}
              </div>
            </section>
          ) : null}
        </article>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-500">익명 반응</p>
              <p className="mt-1 text-sm text-neutral-600">
                반응에는 작성자 정보가 저장되지 않습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-neutral-600">
              {Object.entries(reactionCounts).map(([type, count]) => (
                <span className="rounded-md bg-neutral-100 px-2 py-1" key={type}>
                  {getReactionLabel(type)} {count}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <ReactionBar postId={post.id} />
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-500">익명 댓글</p>
              <h2 className="mt-1 text-xl font-semibold">{post.anonymous_comments.length}개</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {post.anonymous_comments.length === 0 ? (
              <p className="rounded-md bg-neutral-50 p-4 text-sm text-neutral-600">
                아직 댓글이 없습니다.
              </p>
            ) : null}
            {post.anonymous_comments.map((comment) => (
              <article className="rounded-md border border-neutral-200 p-4" key={comment.id}>
                <p className="text-sm leading-6 text-neutral-700">{comment.body}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {new Date(comment.created_at).toLocaleString("ko-KR")}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-6">
            <CommentForm postId={post.id} />
          </div>
        </section>
      </div>
    </main>
  );
}
