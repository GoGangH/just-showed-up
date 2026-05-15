"use client";

import { useActionState } from "react";
import type { HomeGroup } from "@/app/home-data";
import {
  deleteGroupAction,
  transferGroupOwnershipAction,
  updateGroupSettingsAction,
  type GroupFormState,
} from "../actions";

const initialState: GroupFormState = {};

const weekdays = [
  { value: "", label: "나중에 설정" },
  { value: "0", label: "일요일" },
  { value: "1", label: "월요일" },
  { value: "2", label: "화요일" },
  { value: "3", label: "수요일" },
  { value: "4", label: "목요일" },
  { value: "5", label: "금요일" },
  { value: "6", label: "토요일" },
];

const locationTypes = [
  { value: "unset", label: "나중에 설정" },
  { value: "online", label: "온라인" },
  { value: "offline", label: "오프라인" },
  { value: "hybrid", label: "혼합" },
];

export function GroupSettingsForm({
  currentUserId,
  group,
  week,
}: {
  currentUserId: string;
  group: HomeGroup;
  week: string;
}) {
  const [state, formAction, pending] = useActionState(updateGroupSettingsAction, initialState);
  const [transferState, transferAction, transferPending] = useActionState(
    transferGroupOwnershipAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteGroupAction,
    initialState,
  );
  const transferCandidates = group.members.filter((member) => member.userId !== currentUserId);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <input name="group_id" type="hidden" value={group.id} />
        <input name="week" type="hidden" value={week} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">고정 모임 요일</span>
            <select
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
              defaultValue={group.default_meeting_day === null ? "" : String(group.default_meeting_day)}
              name="default_meeting_day"
            >
              {weekdays.map((weekday) => (
                <option key={weekday.value} value={weekday.value}>
                  {weekday.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">고정 모임 시간</span>
            <input
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
              defaultValue={group.default_meeting_time?.slice(0, 5) ?? ""}
              name="default_meeting_time"
              type="time"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-neutral-700">장소 유형</span>
          <select
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
            defaultValue={group.default_location_type}
            name="default_location_type"
          >
            {locationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-700">장소 이름</span>
          <input
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
            defaultValue={group.default_location_name ?? ""}
            name="default_location_name"
            placeholder="예: Google Meet, 강남역 스터디룸"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-700">링크 또는 주소</span>
          <input
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
            defaultValue={group.default_location_url ?? ""}
            name="default_location_url"
            placeholder="https:// 또는 주소"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-700">장소 메모</span>
          <textarea
            className="mt-1 min-h-24 w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
            defaultValue={group.default_location_note ?? ""}
            name="default_location_note"
            placeholder="입장 방법, 예약 정보, 채널명 등을 적어주세요."
          />
        </label>

        {state.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
          disabled={pending}
          type="submit"
        >
          {pending ? "저장 중" : "저장"}
        </button>
      </form>

      <form action={transferAction} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <input name="group_id" type="hidden" value={group.id} />
        <input name="week" type="hidden" value={week} />
        <p className="text-sm font-semibold text-neutral-900">그룹장 위임</p>
        <p className="mt-1 text-xs leading-5 text-neutral-600">
          다른 멤버에게 그룹장을 넘기면 내 역할은 일반 멤버로 변경됩니다.
        </p>
        {transferCandidates.length > 0 ? (
          <>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-neutral-700">새 그룹장</span>
              <select
                className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
                name="new_owner_user_id"
              >
                <option value="">멤버 선택</option>
                {transferCandidates.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.nickname} {member.role === "owner" ? "(그룹장)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                className="size-4 rounded border-neutral-300"
                name="confirm_transfer"
                type="checkbox"
                value="yes"
              />
              그룹장을 위임합니다
            </label>
            {transferState.error ? (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {transferState.error}
              </p>
            ) : null}
            <button
              className="mt-3 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={transferPending}
              type="submit"
            >
              {transferPending ? "위임 중" : "그룹장 위임"}
            </button>
          </>
        ) : (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            위임할 다른 멤버가 아직 없습니다.
          </p>
        )}
      </form>

      <form action={deleteAction} className="rounded-md border border-red-200 bg-red-50 p-4">
        <input name="group_id" type="hidden" value={group.id} />
        <input name="group_name" type="hidden" value={group.name} />
        <p className="text-sm font-semibold text-red-900">그룹 삭제</p>
        <p className="mt-1 text-xs leading-5 text-red-800">
          그룹, 멤버, 주차 글, 댓글, 반응, 일정 기록이 모두 삭제됩니다. 되돌릴 수 없습니다.
        </p>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-red-900">
            삭제하려면 그룹 이름을 입력하세요
          </span>
          <input
            className="mt-1 w-full rounded-md border border-red-200 bg-white px-4 py-3 outline-none focus:border-red-700"
            name="confirm_name"
            placeholder={group.name}
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-red-900">
          <input
            className="size-4 rounded border-red-300"
            name="confirm_delete"
            type="checkbox"
            value="yes"
          />
          이 그룹을 영구 삭제합니다
        </label>
        {deleteState.error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700">
            {deleteState.error}
          </p>
        ) : null}
        <button
          className="mt-3 rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={deletePending}
          type="submit"
        >
          {deletePending ? "삭제 중" : "그룹 삭제"}
        </button>
      </form>
    </div>
  );
}
