"use client";

import { useActionState, useState } from "react";
import { startRescheduleAction, type SessionFormState } from "../actions";

const initialState: SessionFormState = {};

function defaultSlots() {
  const base = new Date();
  const slots: string[] = [];

  for (let index = 1; index <= 4; index += 1) {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    date.setHours(index % 2 === 0 ? 21 : 20, 0, 0, 0);
    slots.push(date.toISOString().slice(0, 16));
  }

  return slots;
}

export function RescheduleForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(startRescheduleAction, initialState);
  const [slots, setSlots] = useState(defaultSlots);

  return (
    <form action={formAction} className="space-y-5">
      <input name="group_id" type="hidden" value={groupId} />

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">재조율 사유</span>
        <input
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          name="reason"
          placeholder="예: 이번 주 기본 시간 참석이 어렵습니다."
        />
      </label>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-neutral-700">후보 시간</span>
          <button
            className="text-sm font-semibold text-neutral-600 hover:text-neutral-900"
            onClick={() => setSlots((current) => [...current, ""])}
            type="button"
          >
            후보 추가
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {slots.map((value, index) => (
            <input
              className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
              defaultValue={value}
              key={index}
              name="slots"
              type="datetime-local"
            />
          ))}
        </div>
      </div>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
          disabled={pending}
          type="submit"
        >
          {pending ? "저장 중" : "재조율 시작"}
        </button>
      </div>
    </form>
  );
}
