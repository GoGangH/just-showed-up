"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { getCurrentWeekStart } from "@/lib/dates/week";
import { fetchLinkPreview } from "@/lib/link-preview/metadata";
import type { Database } from "@/lib/supabase/database.types";

export type PostFormState = {
  error?: string;
};

type WeeklyPostInsert = Database["public"]["Tables"]["weekly_posts"]["Insert"];
type PostLinkInsert = Database["public"]["Tables"]["post_links"]["Insert"];

function collectLinks(formData: FormData) {
  return formData
    .getAll("links")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function createWeeklyPostAction(
  _: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const bodyMarkdown = String(formData.get("body_markdown") ?? "").trim();
  const feedbackQuestion = String(formData.get("feedback_question") ?? "").trim();
  const weekStart = String(formData.get("week_start") ?? getCurrentWeekStart()).trim();
  const links = collectLinks(formData);

  if (!groupId) {
    return { error: "그룹 정보가 필요합니다." };
  }

  if (title.length < 2) {
    return { error: "제목은 2자 이상 입력해주세요." };
  }

  if (bodyMarkdown.length < 10) {
    return { error: "본문은 10자 이상 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const postPayload: WeeklyPostInsert = {
    group_id: groupId,
    author_id: user.id,
    week_start: weekStart,
    title,
    body_markdown: bodyMarkdown,
    feedback_question: feedbackQuestion || null,
  };

  const { data, error } = await supabase
    .from("weekly_posts")
    .insert(postPayload as never)
    .select("id")
    .single();

  const post = data as { id: string } | null;

  if (error || !post) {
    return { error: "공유글을 저장하지 못했습니다. 그룹 권한과 DB 설정을 확인해주세요." };
  }

  if (links.length > 0) {
    const previews = await Promise.all(links.map((link) => fetchLinkPreview(link)));
    const linkPayloads: PostLinkInsert[] = previews.map((preview) => ({
      post_id: post.id,
      url: preview.url,
      title: preview.title,
      description: preview.description,
      image_url: preview.imageUrl,
      site_name: preview.siteName,
    }));

    const { error: linkError } = await supabase.from("post_links").insert(linkPayloads as never);

    if (linkError) {
      return { error: "공유글은 저장되었지만 링크 미리보기를 저장하지 못했습니다." };
    }
  }

  redirect(`/?group=${groupId}`);
}
