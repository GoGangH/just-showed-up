"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { getWeeklyMeetingDateForKstWeek } from "@/lib/dates/kst";
import { getCurrentWeekStart } from "@/lib/dates/week";
import { fetchLinkPreview } from "@/lib/link-preview/metadata";
import { notifyGroupMembers, notifyUser } from "@/lib/notifications";
import { buildLoginHref } from "@/lib/redirects";
import type { Database } from "@/lib/supabase/database.types";

export type PostFormState = {
  error?: string;
};

type WeeklyPostInsert = Database["public"]["Tables"]["weekly_posts"]["Insert"];
type PostLinkInsert = Database["public"]["Tables"]["post_links"]["Insert"];
type PostAttachmentInsert = Database["public"]["Tables"]["post_attachments"]["Insert"];
type AnonymousCommentInsert = Database["public"]["Tables"]["anonymous_comments"]["Insert"];
type AnonymousReactionInsert = Database["public"]["Tables"]["anonymous_reactions"]["Insert"];
type CollectedAttachment = {
  file: File;
  token: string;
};

const attachmentBucket = "post-attachments";
const imageTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);
const pdfTypes = new Set(["application/pdf"]);
const allowedAttachmentTypes = new Set([...imageTypes, ...pdfTypes]);
const maxAttachmentCount = 5;
const maxImageSize = 5 * 1024 * 1024;
const maxPdfSize = 20 * 1024 * 1024;

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

function collectAttachments(formData: FormData) {
  const values = [...formData.getAll("attachments"), ...formData.getAll("images")];
  const files = values.filter((value): value is File => value instanceof File && value.size > 0);
  const tokens = formData.getAll("attachment_tokens").map((value) => String(value));

  return files.map((file, index) => ({
    file,
    token: isUuid(tokens[index]) ? tokens[index] : crypto.randomUUID(),
  }));
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

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  return {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  }[file.type] ?? "file";
}

function validateAttachments(attachments: CollectedAttachment[]) {
  if (attachments.length > maxAttachmentCount) {
    return `첨부 파일은 최대 ${maxAttachmentCount}개까지 올릴 수 있습니다.`;
  }

  const invalidType = attachments.find((attachment) => !allowedAttachmentTypes.has(attachment.file.type));
  if (invalidType) {
    return "첨부 파일은 JPG, PNG, WebP, GIF, PDF 형식만 올릴 수 있습니다.";
  }

  const oversizedImage = attachments.find(
    (attachment) => imageTypes.has(attachment.file.type) && attachment.file.size > maxImageSize,
  );
  if (oversizedImage) {
    return "이미지 한 장의 크기는 5MB 이하여야 합니다.";
  }

  const oversizedPdf = attachments.find(
    (attachment) => pdfTypes.has(attachment.file.type) && attachment.file.size > maxPdfSize,
  );
  if (oversizedPdf) {
    return "PDF 한 개의 크기는 20MB 이하여야 합니다.";
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

async function uploadPostAttachments({
  attachments: files,
  groupId,
  postId,
  supabase,
  userId,
}: {
  attachments: CollectedAttachment[];
  groupId: string;
  postId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
}) {
  const uploadedPaths: string[] = [];
  const attachments: PostAttachmentInsert[] = [];

  for (const [index, attachment] of files.entries()) {
    const file = attachment.file;
    const extension = getFileExtension(file);
    const fileName = getSafeFileName(file.name);
    const filePath = `${userId}/${groupId}/${postId}/${crypto.randomUUID()}-${index}.${extension}`;
    const { error } = await supabase.storage
      .from(attachmentBucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(attachmentBucket).remove(uploadedPaths);
      }
      return {
        attachments: [],
        error: "첨부 파일을 업로드하지 못했습니다. Storage 버킷과 권한 설정을 확인해주세요.",
      };
    }

    uploadedPaths.push(filePath);
    attachments.push({
      id: attachment.token,
      file_name: fileName,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      post_id: postId,
    });
  }

  return { attachments, error: null };
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
  const attachments = collectAttachments(formData);
  const attachmentError = validateAttachments(attachments);

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
    const uploadResult = await uploadPostAttachments({
      attachments,
      groupId,
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

  revalidatePath(`/posts/${postId}`);
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
  const attachments = collectAttachments(formData);
  const attachmentError = validateAttachments(attachments);

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

    const uploadResult = await uploadPostAttachments({
      attachments,
      groupId: post.group_id,
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

  revalidatePath(`/posts/${postId}`);
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

  revalidatePath(`/posts/${postId}`);
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

  redirect(`/?group=${post.group_id}&week=${post.week_start}`);
}

export async function createAnonymousReactionAction(formData: FormData) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const postId = String(formData.get("post_id") ?? "").trim();
  const reactionType = String(formData.get("reaction_type") ?? "").trim();
  const allowedReactions: AnonymousReactionInsert["reaction_type"][] = [
    "helpful",
    "relate",
    "cheer",
    "curious",
    "join",
  ];

  if (!postId || !allowedReactions.includes(reactionType as AnonymousReactionInsert["reaction_type"])) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginHref(`/posts/${postId}`) as never);
  }

  const post = await getFeedbackPostForMember({ postId, supabase });
  if (!post) {
    redirect(`/posts/${postId}`);
  }

  const payload: AnonymousReactionInsert = {
    post_id: postId,
    reaction_type: reactionType as AnonymousReactionInsert["reaction_type"],
  };

  await supabase.from("anonymous_reactions").insert(payload as never);
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}
