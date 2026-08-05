"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { revalidateGroup, revalidateMyPosts, revalidatePost } from "@/lib/cache/revalidation";
import { getWeeklyMeetingDateForKstWeek } from "@/lib/dates/kst";
import { getCurrentWeekStart } from "@/lib/dates/week";
import { fetchLinkPreview } from "@/lib/link-preview/metadata";
import { notifyGroupMembers, notifyUser } from "@/lib/notifications";
import { buildLoginHref } from "@/lib/redirects";
import {
  allowedAttachmentTypes,
  attachmentBucket,
  getMaxSizeForType,
  isImageType,
  maxAttachmentCount,
} from "./attachment-limits";
import type { Database } from "@/lib/supabase/database.types";

export type PostFormState = {
  error?: string;
};

type WeeklyPostInsert = Database["public"]["Tables"]["weekly_posts"]["Insert"];
type PostLinkInsert = Database["public"]["Tables"]["post_links"]["Insert"];
type PostAttachmentInsert = Database["public"]["Tables"]["post_attachments"]["Insert"];
type AnonymousCommentInsert = Database["public"]["Tables"]["anonymous_comments"]["Insert"];
type AnonymousReactionInsert = Database["public"]["Tables"]["anonymous_reactions"]["Insert"];
type UploadedAttachment = {
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  token: string;
};

function collectLinks(formData: FormData) {
  return formData
    .getAll("links")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function validateLinks(links: string[]) {
  for (const link of links) {
    try {
      const url = new URL(link);
      if (!["http:", "https:"].includes(url.protocol)) {
        return "공유 링크는 http 또는 https 주소만 사용할 수 있습니다.";
      }
    } catch {
      return "공유 링크 주소를 다시 확인해주세요.";
    }
  }

  return null;
}

function collectAttachmentUploads(formData: FormData): UploadedAttachment[] {
  return formData
    .getAll("attachment_uploads")
    .map((value) => {
      try {
        return JSON.parse(String(value)) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((value): value is Record<string, unknown> => Boolean(value))
    .map((value) => ({
      file_name: String(value.file_name ?? ""),
      file_path: String(value.file_path ?? ""),
      file_size: Number(value.file_size ?? 0),
      file_type: String(value.file_type ?? ""),
      token: isUuid(String(value.token ?? "")) ? String(value.token) : crypto.randomUUID(),
    }))
    .filter((attachment) => attachment.file_path.length > 0 && attachment.file_name.length > 0);
}

function getSafeFileName(name: string) {
  const fallback = "attachment";
  const safe = name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);

  return safe || fallback;
}

function validateAttachmentUploads(attachments: UploadedAttachment[]) {
  if (attachments.length > maxAttachmentCount) {
    return `첨부 파일은 최대 ${maxAttachmentCount}개까지 올릴 수 있습니다.`;
  }

  const invalidType = attachments.find((attachment) => !allowedAttachmentTypes.has(attachment.file_type));
  if (invalidType) {
    return "첨부 파일은 JPG, PNG, WebP, GIF, PDF 형식만 올릴 수 있습니다.";
  }

  const oversized = attachments.find((attachment) => {
    const maxSize = getMaxSizeForType(attachment.file_type);
    return maxSize !== null && attachment.file_size > maxSize;
  });
  if (oversized) {
    return isImageType(oversized.file_type)
      ? "이미지 한 장의 크기는 5MB 이하여야 합니다."
      : "PDF 한 개의 크기는 20MB 이하여야 합니다.";
  }

  return null;
}

function addWeeks(weekStart: string, amount: number) {
  const [year, month, day] = weekStart.split("-").map(Number);
  if (!year || !month || !day) return weekStart;

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + amount * 7);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getThisWeekMeetingDate(group: {
  default_meeting_day: number | null;
  default_meeting_time: string | null;
}) {
  const currentWeek = getCurrentWeekStart();
  return getWeeklyMeetingDateForKstWeek(
    currentWeek,
    group.default_meeting_day,
    group.default_meeting_time,
  );
}

function isWeekStart(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function validatePostWeek({
  groupId,
  supabase,
  userId,
  weekStart,
}: {
  groupId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
  weekStart: string;
}) {
  if (!isWeekStart(weekStart)) {
    return "작성 주차를 다시 선택해주세요.";
  }

  const { data: groupData } = await supabase
    .from("groups")
    .select("created_at,default_meeting_day,default_meeting_time")
    .eq("id", groupId)
    .single();
  const group = groupData as {
    created_at: string;
    default_meeting_day: number | null;
    default_meeting_time: string | null;
  } | null;

  if (!group) {
    return "그룹 정보를 확인하지 못했습니다.";
  }

  const currentWeek = getCurrentWeekStart();
  const studyStartWeek = getCurrentWeekStart(new Date(group.created_at));
  const thisWeekMeeting = getThisWeekMeetingDate(group);
  let canWriteNextWeek = thisWeekMeeting ? Date.now() >= thisWeekMeeting.getTime() : false;

  if (!thisWeekMeeting) {
    const { data: currentPostData } = await supabase
      .from("weekly_posts")
      .select("id")
      .eq("group_id", groupId)
      .eq("author_id", userId)
      .eq("week_start", currentWeek)
      .maybeSingle();
    canWriteNextWeek = Boolean(currentPostData);
  }

  const maxWeek = canWriteNextWeek ? addWeeks(currentWeek, 1) : currentWeek;
  if (weekStart < studyStartWeek || weekStart > maxWeek) {
    return "아직 작성할 수 없는 주차입니다.";
  }

  return null;
}

async function getFeedbackPostForMember({
  postId,
  supabase,
}: {
  postId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
}) {
  const { data } = await supabase
    .from("weekly_posts")
    .select("id,group_id,author_id,title")
    .eq("id", postId)
    .single();

  return data as {
    author_id: string;
    group_id: string;
    id: string;
    title: string;
  } | null;
}

// Attachments are uploaded directly from the browser to Supabase Storage before the
// form is ever submitted (see PostAttachmentInput), so this only has to verify that
// each claimed object really exists, belongs to this user, and satisfies the size/type
// policy — using the real stored metadata rather than trusting the client's claims.
async function finalizeAttachments({
  attachments,
  postId,
  supabase,
  userId,
}: {
  attachments: UploadedAttachment[];
  postId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
}) {
  const inserts: PostAttachmentInsert[] = [];
  const acceptedPaths: string[] = [];

  const fail = async (error: string, extraPathToRemove?: string) => {
    const paths = extraPathToRemove ? [...acceptedPaths, extraPathToRemove] : acceptedPaths;
    if (paths.length > 0) {
      await supabase.storage.from(attachmentBucket).remove(paths);
    }
    return { attachments: [], error };
  };

  for (const attachment of attachments) {
    const pathParts = attachment.file_path.split("/");
    if (pathParts[0] !== userId) {
      return fail("첨부 파일 소유자를 확인하지 못했습니다.");
    }

    const folder = pathParts.slice(0, -1).join("/");
    const objectName = pathParts[pathParts.length - 1];
    const { data: listData } = await supabase.storage
      .from(attachmentBucket)
      .list(folder, { search: objectName });
    const found = ((listData ?? []) as { name: string; metadata: { mimetype?: string; size?: number } | null }[]).find(
      (item) => item.name === objectName,
    );

    if (!found) {
      return fail("첨부 파일을 확인하지 못했습니다. 다시 업로드해주세요.");
    }

    const actualSize = Number(found.metadata?.size ?? attachment.file_size);
    const actualType = String(found.metadata?.mimetype ?? attachment.file_type);

    if (!allowedAttachmentTypes.has(actualType)) {
      return fail("첨부 파일은 JPG, PNG, WebP, GIF, PDF 형식만 올릴 수 있습니다.", attachment.file_path);
    }

    const maxSize = getMaxSizeForType(actualType);
    if (maxSize !== null && actualSize > maxSize) {
      return fail(
        isImageType(actualType)
          ? "이미지 한 장의 크기는 5MB 이하여야 합니다."
          : "PDF 한 개의 크기는 20MB 이하여야 합니다.",
        attachment.file_path,
      );
    }

    acceptedPaths.push(attachment.file_path);
    inserts.push({
      id: attachment.token,
      file_name: getSafeFileName(attachment.file_name),
      file_path: attachment.file_path,
      file_size: actualSize,
      file_type: actualType,
      post_id: postId,
    });
  }

  return { attachments: inserts, error: null };
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
  const linkError = validateLinks(links);
  const attachments = collectAttachmentUploads(formData);
  const attachmentError = validateAttachmentUploads(attachments);

  if (!groupId) {
    return { error: "그룹 정보가 필요합니다." };
  }

  if (title.length < 2) {
    return { error: "제목은 2자 이상 입력해주세요." };
  }

  if (bodyMarkdown.length < 10) {
    return { error: "본문은 10자 이상 입력해주세요." };
  }

  if (attachmentError) {
    return { error: attachmentError };
  }

  if (linkError) {
    return { error: linkError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const weekError = await validatePostWeek({
    groupId,
    supabase,
    userId: user.id,
    weekStart,
  });

  if (weekError) {
    return { error: weekError };
  }

  const { data: existingPostData } = await supabase
    .from("weekly_posts")
    .select("id")
    .eq("group_id", groupId)
    .eq("author_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();
  const existingPost = existingPostData as { id: string } | null;

  if (existingPost) {
    redirect(`/posts/${existingPost.id}/edit`);
  }

  const postId = crypto.randomUUID();
  const postPayload: WeeklyPostInsert = {
    id: postId,
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

  if (attachments.length > 0) {
    const uploadResult = await finalizeAttachments({
      attachments,
      postId: post.id,
      supabase,
      userId: user.id,
    });

    if (uploadResult.error) {
      await supabase.from("weekly_posts").delete().eq("id", post.id).eq("author_id", user.id);
      return { error: uploadResult.error };
    }

    const { error: attachmentError } = await supabase
      .from("post_attachments")
      .insert(uploadResult.attachments as never);

    if (attachmentError) {
      await supabase.storage
        .from(attachmentBucket)
        .remove(uploadResult.attachments.map((attachment) => attachment.file_path));
      await supabase.from("weekly_posts").delete().eq("id", post.id).eq("author_id", user.id);
      return { error: "첨부 파일 정보를 저장하지 못했습니다." };
    }
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

  await notifyGroupMembers(supabase, {
    actorId: user.id,
    body: title,
    excludeUserIds: [user.id],
    groupId,
    href: `/posts/${post.id}`,
    title: "새 공유글이 올라왔습니다",
    type: "weekly_post_created",
  });

  revalidateGroup(groupId);
  revalidateMyPosts();
  redirect(`/posts/${post.id}`);
}

export async function createAnonymousCommentAction(
  _: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const postId = String(formData.get("post_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!postId) {
    return { error: "공유글 정보가 필요합니다." };
  }

  if (body.length < 1) {
    return { error: "댓글 내용을 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const post = await getFeedbackPostForMember({ postId, supabase });
  if (!post) {
    return { error: "댓글을 남길 수 있는 그룹 멤버인지 확인하지 못했습니다." };
  }

  const payload: AnonymousCommentInsert = {
    post_id: postId,
    body,
  };
  const { error } = await supabase.from("anonymous_comments").insert(payload as never);

  if (error) {
    return { error: "댓글을 저장하지 못했습니다. 그룹 권한과 DB 설정을 확인해주세요." };
  }

  if (post.author_id !== user.id) {
    await notifyUser(supabase, {
      actor_id: null,
      body: post.title,
      group_id: post.group_id,
      href: `/posts/${post.id}`,
      title: "내 글에 익명 댓글이 달렸습니다",
      type: "anonymous_comment_created",
      user_id: post.author_id,
    });
  }

  revalidatePost(postId);
  revalidateGroup(post.group_id);
  return {};
}

export async function updateWeeklyPostAction(
  _: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const postId = String(formData.get("post_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const bodyMarkdown = String(formData.get("body_markdown") ?? "").trim();
  const feedbackQuestion = String(formData.get("feedback_question") ?? "").trim();
  const links = collectLinks(formData);
  const linkError = validateLinks(links);
  const attachments = collectAttachmentUploads(formData);
  const attachmentError = validateAttachmentUploads(attachments);

  if (!postId) {
    return { error: "공유글 정보가 필요합니다." };
  }

  if (title.length < 2) {
    return { error: "제목은 2자 이상 입력해주세요." };
  }

  if (bodyMarkdown.length < 10) {
    return { error: "본문은 10자 이상 입력해주세요." };
  }

  if (attachmentError) {
    return { error: attachmentError };
  }

  if (linkError) {
    return { error: linkError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: currentPostData } = await supabase
    .from("weekly_posts")
    .select("group_id,week_start")
    .eq("id", postId)
    .eq("author_id", user.id)
    .single();
  const currentPost = currentPostData as { group_id: string; week_start: string } | null;

  if (!currentPost) {
    return { error: "공유글 정보를 확인하지 못했습니다." };
  }

  const { error } = await supabase
    .from("weekly_posts")
    .update({
      body_markdown: bodyMarkdown,
      feedback_question: feedbackQuestion || null,
      title,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) {
    return { error: "공유글을 수정하지 못했습니다. 작성자 권한을 확인해주세요." };
  }

  if (attachments.length > 0) {
    const { data: postData } = await supabase
      .from("weekly_posts")
      .select("id,group_id,author_id")
      .eq("id", postId)
      .eq("author_id", user.id)
      .single();
    const post = postData as { author_id: string; group_id: string; id: string } | null;

    if (!post) {
      return { error: "공유글 정보를 확인하지 못했습니다." };
    }

    const { data: existingAttachmentData } = await supabase
      .from("post_attachments")
      .select("id")
      .eq("post_id", postId);
    const existingAttachmentCount = (existingAttachmentData ?? []).length;

    if (existingAttachmentCount + attachments.length > maxAttachmentCount) {
      return { error: `첨부 파일은 총 ${maxAttachmentCount}개까지만 유지할 수 있습니다.` };
    }

    const uploadResult = await finalizeAttachments({
      attachments,
      postId,
      supabase,
      userId: user.id,
    });

    if (uploadResult.error) {
      return { error: uploadResult.error };
    }

    const { error: attachmentError } = await supabase
      .from("post_attachments")
      .insert(uploadResult.attachments as never);

    if (attachmentError) {
      await supabase.storage
        .from(attachmentBucket)
        .remove(uploadResult.attachments.map((attachment) => attachment.file_path));
      return { error: "첨부 파일 정보를 저장하지 못했습니다." };
    }
  }

  const { error: deleteLinkError } = await supabase.from("post_links").delete().eq("post_id", postId);

  if (deleteLinkError) {
    return { error: "공유글은 수정되었지만 기존 링크를 정리하지 못했습니다." };
  }

  if (links.length > 0) {
    const previews = await Promise.all(links.map((link) => fetchLinkPreview(link)));
    const linkPayloads: PostLinkInsert[] = previews.map((preview) => ({
      post_id: postId,
      url: preview.url,
      title: preview.title,
      description: preview.description,
      image_url: preview.imageUrl,
      site_name: preview.siteName,
    }));

    const { error: linkError } = await supabase.from("post_links").insert(linkPayloads as never);

    if (linkError) {
      return { error: "공유글은 수정되었지만 링크 미리보기를 저장하지 못했습니다." };
    }
  }

  revalidatePost(postId);
  revalidateGroup(currentPost.group_id);
  revalidateMyPosts();
  redirect(`/posts/${postId}`);
}

export async function deletePostAttachmentAction(formData: FormData) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const attachmentId = String(formData.get("attachment_id") ?? "").trim();
  const postId = String(formData.get("post_id") ?? "").trim();

  if (!attachmentId || !postId) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginHref(`/posts/${postId}/edit`) as never);
  }

  const { data: postData } = await supabase
    .from("weekly_posts")
    .select("id,author_id")
    .eq("id", postId)
    .single();
  const post = postData as { author_id: string; id: string } | null;

  if (!post || post.author_id !== user.id) {
    redirect(`/posts/${postId}`);
  }

  const { data: attachmentData } = await supabase
    .from("post_attachments")
    .select("id,file_path")
    .eq("id", attachmentId)
    .eq("post_id", postId)
    .single();
  const attachment = attachmentData as { file_path: string; id: string } | null;

  if (!attachment) {
    redirect(`/posts/${postId}/edit`);
  }

  await supabase
    .from("post_attachments")
    .delete()
    .eq("id", attachment.id)
    .eq("post_id", postId);
  await supabase.storage.from(attachmentBucket).remove([attachment.file_path]);

  revalidatePost(postId);
  redirect(`/posts/${postId}/edit`);
}

export async function deleteWeeklyPostAction(formData: FormData) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const postId = String(formData.get("post_id") ?? "").trim();
  const confirmDelete = String(formData.get("confirm_delete") ?? "") === "yes";

  if (!postId || !confirmDelete) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginHref(`/posts/${postId}/edit`) as never);
  }

  const { data: postData } = await supabase
    .from("weekly_posts")
    .select("id,author_id,group_id,week_start,post_attachments(file_path)")
    .eq("id", postId)
    .single();
  const post = postData as {
    author_id: string;
    group_id: string;
    id: string;
    post_attachments: { file_path: string }[];
    week_start: string;
  } | null;

  if (!post || post.author_id !== user.id) {
    redirect(`/posts/${postId}`);
  }

  const filePaths = post.post_attachments.map((attachment) => attachment.file_path);
  if (filePaths.length > 0) {
    await supabase.storage.from(attachmentBucket).remove(filePaths);
  }

  await supabase.from("weekly_posts").delete().eq("id", post.id).eq("author_id", user.id);

  revalidateGroup(post.group_id);
  revalidatePost(post.id);
  revalidateMyPosts();
  redirect(`/groups/${post.group_id}?week=${post.week_start}`);
}

export async function createAnonymousReactionAction(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "").trim();
  redirect(`/posts/${postId}`);
}
