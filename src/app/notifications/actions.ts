"use server";

import { revalidateAppShell } from "@/lib/cache/revalidation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export async function markAllNotificationsReadAction() {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    return { error: "알림을 읽음 처리하지 못했습니다." };
  }

  revalidateAppShell();
  return {};
}

export async function deleteNotificationAction(notificationId: string) {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "알림을 삭제하지 못했습니다." };
  }

  revalidateAppShell();
  return {};
}
