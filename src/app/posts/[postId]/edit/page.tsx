import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buildLoginHref } from "@/lib/redirects";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { PostEditForm } from "./PostEditForm";

type EditPostPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  if (!hasSupabaseConfig()) {
    redirect("/");
  }

  const { postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginHref(`/posts/${postId}/edit`) as never);
  }

  const { data } = await supabase
    .from("weekly_posts")
    .select("id,title,body_markdown,feedback_question,author_id,post_links(url),post_attachments(id,file_name,file_type,file_size,file_path)")
    .eq("id", postId)
    .single();

  const post = data as {
    author_id: string;
    body_markdown: string;
    feedback_question: string | null;
    id: string;
    post_attachments: {
      file_name: string;
      file_path: string;
      file_size: number;
      file_type: string;
      id: string;
    }[];
    post_links: { url: string }[];
    title: string;
  } | null;

  if (!post) {
    notFound();
  }

  if (post.author_id !== user.id) {
    redirect(`/posts/${post.id}`);
  }

  const attachments = await Promise.all(
    post.post_attachments.map(async (attachment) => {
      if (!attachment.file_type.startsWith("image/")) {
        return { ...attachment, signedUrl: null };
      }

      const { data: signedData } = await supabase.storage
        .from("post-attachments")
        .createSignedUrl(attachment.file_path, 60 * 30);

      return {
        ...attachment,
        signedUrl: signedData?.signedUrl ?? null,
      };
    }),
  );

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-neutral-200 bg-white p-6">
        <Link className="text-sm font-semibold text-neutral-500" href={`/posts/${post.id}`}>
          글로 돌아가기
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">공유글 수정</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          모임 전에 공유할 진행 내용, 자료 링크, 피드백 질문을 수정합니다.
        </p>

        <div className="mt-6">
          <PostEditForm
            post={{
              body_markdown: post.body_markdown,
              feedback_question: post.feedback_question,
              id: post.id,
              attachments,
              links: post.post_links.map((link) => link.url),
              title: post.title,
            }}
          />
        </div>
      </section>
    </main>
  );
}
