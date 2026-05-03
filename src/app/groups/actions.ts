"use server";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type GroupFormState = {
  error?: string;
};

const locationTypes = ["online", "offline", "hybrid", "unset"] as const;
type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"];

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function createGroupAction(
  _: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const meetingDayValue = String(formData.get("default_meeting_day") ?? "");
  const meetingDay = meetingDayValue === "" ? null : Number(meetingDayValue);
  const locationTypeValue = String(formData.get("default_location_type") ?? "unset");
  const locationType = locationTypes.includes(locationTypeValue as (typeof locationTypes)[number])
    ? (locationTypeValue as (typeof locationTypes)[number])
    : "unset";

  if (name.length < 2) {
    return { error: "그룹 이름은 2자 이상 입력해주세요." };
  }

  if (meetingDay !== null && (!Number.isInteger(meetingDay) || meetingDay < 0 || meetingDay > 6)) {
    return { error: "모임 요일을 다시 선택해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const payload: GroupInsert = {
    name,
    created_by: user.id,
    default_meeting_day: meetingDay,
    default_meeting_time: optionalString(formData.get("default_meeting_time")),
    default_location_type: locationType,
    default_location_name: optionalString(formData.get("default_location_name")),
    default_location_url: optionalString(formData.get("default_location_url")),
    default_location_note: optionalString(formData.get("default_location_note")),
  };

  const { data, error } = await supabase
    .from("groups")
    .insert(payload as never)
    .select("id")
    .single();

  const createdGroup = data as { id: string } | null;

  if (error || !createdGroup) {
    return { error: "그룹을 만들지 못했습니다. 잠시 후 다시 시도해주세요." };
  }

  redirect(`/?group=${createdGroup.id}`);
}

export async function joinGroupAction(
  _: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const code = String(formData.get("invite_code") ?? "").trim();
  if (!code) {
    return { error: "초대 코드를 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase.rpc("join_group_by_code", { code } as never);
  const groupId = data as string | null;

  if (error || !groupId) {
    return { error: "초대 코드를 확인해주세요." };
  }

  redirect(`/?group=${groupId}`);
}
