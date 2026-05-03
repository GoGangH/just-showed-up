"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { getCurrentWeekStart } from "@/lib/dates/week";
import type { Database } from "@/lib/supabase/database.types";

export type SessionFormState = {
  error?: string;
};

type StudySessionInsert = Database["public"]["Tables"]["study_sessions"]["Insert"];
type TimeSlotInsert = Database["public"]["Tables"]["session_time_slots"]["Insert"];

function parseLocalSlot(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const endsAt = new Date(date);
  endsAt.setMinutes(endsAt.getMinutes() + 30);

  return {
    starts_at: date.toISOString(),
    ends_at: endsAt.toISOString(),
  };
}

export async function startRescheduleAction(
  _: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const slotValues = formData
    .getAll("slots")
    .map((slot) => String(slot).trim())
    .filter(Boolean);

  if (!groupId) {
    return { error: "그룹 정보가 필요합니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const sessionPayload: StudySessionInsert = {
    group_id: groupId,
    week_start: getCurrentWeekStart(),
    status: "rescheduling",
    reschedule_requested_by: user.id,
    reschedule_reason: reason || null,
  };

  const { data: sessionData, error: sessionError } = await supabase
    .from("study_sessions")
    .upsert(sessionPayload as never, { onConflict: "group_id,week_start" })
    .select("id")
    .single();

  const session = sessionData as { id: string } | null;

  if (sessionError || !session) {
    return { error: "재조율을 시작하지 못했습니다. DB 설정과 그룹 권한을 확인해주세요." };
  }

  const slots: TimeSlotInsert[] = slotValues
    .map(parseLocalSlot)
    .filter((slot): slot is { starts_at: string; ends_at: string } => Boolean(slot))
    .map((slot) => ({
      session_id: session.id,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
    }));

  if (slotValues.length > 0 && slots.length !== slotValues.length) {
    return { error: "후보 시간 형식을 확인해주세요." };
  }

  if (slots.length === 0) {
    redirect(`/?group=${groupId}`);
  }

  const { error: slotError } = await supabase.from("session_time_slots").insert(slots as never);

  if (slotError) {
    return { error: "후보 시간을 저장하지 못했습니다." };
  }

  redirect(`/?group=${groupId}`);
}
