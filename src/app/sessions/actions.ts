"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { getCurrentWeekStart } from "@/lib/dates/week";
import { notifyGroupMembers, notifyGroupOwners } from "@/lib/notifications";
import type { Database } from "@/lib/supabase/database.types";

export type SessionFormState = {
  error?: string;
};

type StudySessionInsert = Database["public"]["Tables"]["study_sessions"]["Insert"];
type TimeSlotInsert = Database["public"]["Tables"]["session_time_slots"]["Insert"];
type AvailabilityInsert = Database["public"]["Tables"]["session_availabilities"]["Insert"];
type SessionResponseInsert = Database["public"]["Tables"]["session_responses"]["Insert"];

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

  const { error: deleteAvailabilityError } = await supabase
    .from("session_availabilities")
    .delete()
    .eq("session_id", session.id)
    .eq("user_id", user.id);

  if (deleteAvailabilityError) {
    return { error: "기존 가능 시간을 정리하지 못했습니다." };
  }

  const { data: existingResponseData } = await supabase
    .from("session_responses")
    .select("session_id")
    .eq("session_id", session.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const hadResponded = Boolean(existingResponseData);

  const responsePayload: SessionResponseInsert = {
    session_id: session.id,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };
  const { error: responseError } = await supabase
    .from("session_responses")
    .upsert(responsePayload as never, { onConflict: "session_id,user_id" });

  if (responseError) {
    return { error: "응답 상태를 저장하지 못했습니다." };
  }

  if (slots.length === 0) {
    await notifyRescheduleCompletedIfNeeded({
      groupId,
      hadResponded,
      sessionId: session.id,
      supabase,
      userId: user.id,
    });
    redirect(`/?group=${groupId}`);
  }

  const { data: existingSlotData, error: existingSlotError } = await supabase
    .from("session_time_slots")
    .select("id,starts_at")
    .eq("session_id", session.id);

  if (existingSlotError) {
    return { error: "기존 후보 시간을 불러오지 못했습니다." };
  }

  const existingSlots = ((existingSlotData ?? []) as { id: string; starts_at: string }[]).map(
    (slot) => ({
      id: slot.id,
      starts_at: new Date(slot.starts_at).toISOString(),
    }),
  );
  const existingStarts = new Set(existingSlots.map((slot) => slot.starts_at));
  const missingSlots = slots.filter((slot) => !existingStarts.has(slot.starts_at));

  const { data: insertedSlotData, error: insertSlotError } =
    missingSlots.length > 0
      ? await supabase.from("session_time_slots").insert(missingSlots as never).select("id,starts_at")
      : { data: [], error: null };

  if (insertSlotError) {
    return { error: "후보 시간을 저장하지 못했습니다." };
  }

  const allSlots = [
    ...existingSlots,
    ...((insertedSlotData ?? []) as { id: string; starts_at: string }[]).map((slot) => ({
      id: slot.id,
      starts_at: new Date(slot.starts_at).toISOString(),
    })),
  ];
  const slotIdsByStart = new Map(allSlots.map((slot) => [slot.starts_at, slot.id]));
  const selectedSlotIds = slots
    .map((slot) => slotIdsByStart.get(slot.starts_at))
    .filter((slotId): slotId is string => Boolean(slotId));

  if (selectedSlotIds.length !== slots.length) {
    return { error: "선택한 후보 시간을 확인하지 못했습니다." };
  }

  const availabilities: AvailabilityInsert[] = selectedSlotIds.map((slotId) => ({
    session_id: session.id,
    slot_id: slotId,
    user_id: user.id,
  }));

  const { error: availabilityError } = await supabase
    .from("session_availabilities")
    .insert(availabilities as never);

  if (availabilityError) {
    return { error: "가능 시간을 저장하지 못했습니다." };
  }

  await notifyRescheduleCompletedIfNeeded({
    groupId,
    hadResponded,
    sessionId: session.id,
    supabase,
    userId: user.id,
  });

  await notifyGroupMembers(supabase, {
    actorId: user.id,
    body: "이번 주 가능한 시간을 선택해주세요.",
    excludeUserIds: [user.id],
    groupId,
    href: `/?group=${groupId}&modal=reschedule`,
    title: "일정 재조율 응답이 필요합니다",
    type: "reschedule_vote_needed",
  });

  redirect(`/?group=${groupId}`);
}

async function notifyRescheduleCompletedIfNeeded({
  groupId,
  hadResponded,
  sessionId,
  supabase,
  userId,
}: {
  groupId: string;
  hadResponded: boolean;
  sessionId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  if (hadResponded) {
    return;
  }

  const [memberResult, responseResult] = await Promise.all([
    supabase.from("group_members").select("user_id", { count: "exact", head: true }).eq("group_id", groupId),
    supabase.from("session_responses").select("user_id", { count: "exact", head: true }).eq("session_id", sessionId),
  ]);

  const memberCount = memberResult.count ?? 0;
  const responseCount = responseResult.count ?? 0;
  if (memberResult.error || responseResult.error || memberCount === 0 || responseCount < memberCount) {
    return;
  }

  await notifyGroupOwners(supabase, {
    actorId: userId,
    body: "모든 멤버가 이번 주 가능한 시간을 제출했습니다.",
    groupId,
    href: `/?group=${groupId}&modal=reschedule`,
    title: "일정 재조율 응답이 완료되었습니다",
    type: "reschedule_vote_completed",
  });
}

export async function confirmRescheduleAction(formData: FormData) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const startsAtValue = String(formData.get("starts_at") ?? "").trim();
  const startsAt = new Date(startsAtValue);

  if (!groupId || Number.isNaN(startsAt.getTime())) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: membershipData } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  const membership = membershipData as { role: "owner" | "member" } | null;

  if (membership?.role !== "owner") {
    return;
  }

  const { data: sessionData } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("group_id", groupId)
    .eq("week_start", getCurrentWeekStart())
    .maybeSingle();
  const session = sessionData as { id: string } | null;

  if (!session) {
    return;
  }

  const { error } = await supabase
    .from("study_sessions")
    .update({
      scheduled_at: startsAt.toISOString(),
      status: "confirmed",
    } as never)
    .eq("id", session.id);

  if (error) {
    return;
  }

  await notifyGroupMembers(supabase, {
    actorId: user.id,
    body: startsAt.toLocaleString("ko-KR", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "long",
      weekday: "short",
    }),
    excludeUserIds: [user.id],
    groupId,
    href: `/?group=${groupId}`,
    title: "이번 주 일정이 확정되었습니다",
    type: "schedule_confirmed",
  });

  redirect(`/?group=${groupId}`);
}
