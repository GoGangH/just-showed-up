"use client";

import { useActionState } from "react";
import { createGroupAction, type GroupFormState } from "../actions";

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

export function GroupCreateForm() {
  const [state, formAction, pending] = useActionState(createGroupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">그룹 이름</span>
        <input
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          defaultValue="쉬었음청년 스터디"
          name="name"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">기본 모임 요일</span>
          <select
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
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
          <span className="text-sm font-medium text-neutral-700">기본 모임 시간</span>
          <input
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
            name="default_meeting_time"
            type="time"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">장소 유형</span>
        <select
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          name="default_location_type"
        >
          <option value="unset">나중에 설정</option>
          <option value="online">온라인</option>
          <option value="offline">오프라인</option>
          <option value="hybrid">혼합</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">장소 이름</span>
        <input
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          name="default_location_name"
          placeholder="예: Google Meet, 강남역 스터디룸"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">링크 또는 주소</span>
        <input
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          name="default_location_url"
          placeholder="https:// 또는 주소"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">장소 메모</span>
        <textarea
          className="mt-1 min-h-24 w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
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
        {pending ? "생성 중" : "그룹 만들기"}
      </button>
    </form>
  );
}
