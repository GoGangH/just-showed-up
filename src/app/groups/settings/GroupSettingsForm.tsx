"use client";

import { useActionState } from "react";
import type { HomeGroup } from "@/app/home-data";
import { updateGroupSettingsAction, type GroupFormState } from "../actions";

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
  group,
  week,
}: {
  group: HomeGroup;
  week: string;
}) {
  const [state, formAction, pending] = useActionState(updateGroupSettingsAction, initialState);

  return (
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
  );
}
