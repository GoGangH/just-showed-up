import { NextResponse } from "next/server";
import { revalidateGroup, revalidatePost } from "@/lib/cache/revalidation";
import { buildLoginHref } from "@/lib/redirects";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ReactionType =
  Database["public"]["Tables"]["anonymous_reactions"]["Insert"]["reaction_type"];

const allowedReactions: ReactionType[] = ["helpful", "relate", "cheer", "curious", "join"];

type RouteProps = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase 환경변수를 먼저 설정해주세요." }, { status: 503 });
  }

  const { postId } = await params;
  const body = (await request.json().catch(() => null)) as { reactionType?: string } | null;
  const reactionType = String(body?.reactionType ?? "").trim();

  if (!postId || !allowedReactions.includes(reactionType as ReactionType)) {
    return NextResponse.json({ error: "반응 정보를 확인해주세요." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다.", loginHref: buildLoginHref(`/posts/${postId}`) },
      { status: 401 },
    );
  }

  const { data: postData } = await supabase
    .from("weekly_posts")
    .select("id,group_id")
    .eq("id", postId)
    .single();
  const post = postData as { group_id: string; id: string } | null;

  if (!post) {
    return NextResponse.json({ error: "공유글을 찾지 못했습니다." }, { status: 404 });
  }

  const { error } = await supabase.from("anonymous_reactions").insert({
    post_id: postId,
    reaction_type: reactionType as ReactionType,
  } as never);

  if (error) {
    return NextResponse.json({ error: "반응을 저장하지 못했습니다." }, { status: 500 });
  }

  revalidatePost(postId);
  revalidateGroup(post.group_id);

  const { data: countsData } = await supabase
    .from("anonymous_reactions")
    .select("reaction_type")
    .eq("post_id", postId);
  const counts = ((countsData ?? []) as { reaction_type: string }[]).reduce<Record<string, number>>(
    (acc, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return NextResponse.json({ counts });
}
