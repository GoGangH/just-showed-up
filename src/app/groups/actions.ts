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
type GroupUpdate = Database["public"]["Tables"]["groups"]["Update"];

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
    id: crypto.randomUUID(),
    name,
    created_by: user.id,
    default_meeting_day: meetingDay,
    default_meeting_time: optionalString(formData.get("default_meeting_time")),
    default_location_type: locationType,
    default_location_name: optionalString(formData.get("default_location_name")),
    default_location_url: optionalString(formData.get("default_location_url")),
    default_location_note: optionalString(formData.get("default_location_note")),
  };

  const { error } = await supabase.from("groups").insert(payload as never);

  if (error) {
    return { error: "그룹을 만들지 못했습니다. 그룹 권한과 DB 설정을 확인해주세요." };
  }

  redirect(`/groups/${payload.id}`);
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

  redirect(`/groups/${groupId}`);
}

export async function updateGroupSettingsAction(
  _: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const week = String(formData.get("week") ?? "").trim();
  const meetingDayValue = String(formData.get("default_meeting_day") ?? "");
  const meetingDay = meetingDayValue === "" ? null : Number(meetingDayValue);
  const locationTypeValue = String(formData.get("default_location_type") ?? "unset");
  const locationType = locationTypes.includes(locationTypeValue as (typeof locationTypes)[number])
    ? (locationTypeValue as (typeof locationTypes)[number])
    : "unset";

  if (!groupId) {
    return { error: "수정할 그룹을 찾지 못했습니다." };
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

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  const ownerMembership = membership as { role: "owner" | "member" } | null;

  if (membershipError || ownerMembership?.role !== "owner") {
    return { error: "그룹장만 모임 정보를 수정할 수 있습니다." };
  }

  const payload: GroupUpdate = {
    default_meeting_day: meetingDay,
    default_meeting_time: optionalString(formData.get("default_meeting_time")),
    default_location_type: locationType,
    default_location_name: optionalString(formData.get("default_location_name")),
    default_location_url: optionalString(formData.get("default_location_url")),
    default_location_note: optionalString(formData.get("default_location_note")),
  };

  const { error } = await supabase.from("groups").update(payload as never).eq("id", groupId);

  if (error) {
    return { error: "그룹 정보를 수정하지 못했습니다. 권한과 DB 설정을 확인해주세요." };
  }

  const weekQuery = week ? `?week=${encodeURIComponent(week)}` : "";
  redirect(`/groups/${groupId}${weekQuery}`);
}

export async function leaveGroupAction(
  _: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const confirmLeave = String(formData.get("confirm_leave") ?? "") === "yes";

  if (!groupId) {
    return { error: "탈퇴할 그룹을 찾지 못했습니다." };
  }

  if (!confirmLeave) {
    return { error: "탈퇴 확인에 체크해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.rpc("leave_group", { target_group_id: groupId } as never);

  if (error) {
    return {
      error:
        error.message === "last owner cannot leave"
          ? "마지막 그룹장은 탈퇴할 수 없습니다. 먼저 그룹장을 위임하거나 그룹 삭제 기능을 사용해야 합니다."
          : "그룹에서 나가지 못했습니다. 멤버 권한과 DB migration 적용 여부를 확인해주세요.",
    };
  }

  redirect("/");
}

export async function transferGroupOwnershipAction(
  _: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const week = String(formData.get("week") ?? "").trim();
  const newOwnerUserId = String(formData.get("new_owner_user_id") ?? "").trim();
  const confirmTransfer = String(formData.get("confirm_transfer") ?? "") === "yes";

  if (!groupId) {
    return { error: "그룹을 찾지 못했습니다." };
  }

  if (!newOwnerUserId) {
    return { error: "새 그룹장을 선택해주세요." };
  }

  if (!confirmTransfer) {
    return { error: "위임 확인에 체크해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (newOwnerUserId === user.id) {
    return { error: "본인에게는 그룹장을 위임할 수 없습니다." };
  }

  const { error } = await supabase.rpc("transfer_group_ownership", {
    new_owner_user_id: newOwnerUserId,
    target_group_id: groupId,
  } as never);

  if (error) {
    return {
      error:
        error.message === "new owner is not a group member"
          ? "선택한 사용자가 이 그룹의 멤버가 아닙니다."
          : "그룹장을 위임하지 못했습니다. 권한과 DB migration 적용 여부를 확인해주세요.",
    };
  }

  redirect(
    `/groups/${groupId}${week ? `?week=${encodeURIComponent(week)}&modal=group-settings` : "?modal=group-settings"}`,
  );
}
