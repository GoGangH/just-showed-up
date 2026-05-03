"use client";

import { useActionState, useMemo, useState } from "react";
import { startRescheduleAction, type SessionFormState } from "../actions";

const initialState: SessionFormState = {};
const hours = [18, 19, 20, 21, 22, 23];
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function toLocalInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:00`;
}

function buildDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

export function RescheduleForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(startRescheduleAction, initialState);
  const days = useMemo(buildDays, []);
  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    days.slice(1, 3).forEach((day) => {
      [20, 21].forEach((hour) => {
        const slot = new Date(day);
        slot.setHours(hour, 0, 0, 0);
        initial.add(toLocalInputValue(slot));
      });
    });
    return initial;
  });

  function toggleSlot(value: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      <input name="group_id" type="hidden" value={groupId} />
      {Array.from(selected).map((slot) => (
        <input key={slot} name="slots" type="hidden" value={slot} />
      ))}

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
          <div>
            <p className="text-sm font-medium text-neutral-700">가능한 시간 선택</p>
            <p className="mt-1 text-xs text-neutral-500">
              가능한 칸을 선택하세요. 선택된 시간이 겹칠수록 나중에 더 진하게 표시됩니다.
            </p>
          </div>
          <p className="text-sm font-semibold text-neutral-700">{selected.size}개 선택</p>
        </div>

        <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200">
          <div className="grid min-w-[560px] grid-cols-[72px_repeat(5,minmax(88px,1fr))]">
            <div className="border-b border-r border-neutral-200 bg-neutral-50 p-2 text-xs font-semibold text-neutral-500">
              시간
            </div>
            {days.map((day) => (
              <div
                className="border-b border-r border-neutral-200 bg-neutral-50 p-2 text-center text-xs font-semibold text-neutral-700 last:border-r-0"
                key={day.toISOString()}
              >
                <span className="block">{weekdayLabels[day.getDay()]}</span>
                <span className="text-neutral-500">
                  {day.getMonth() + 1}/{day.getDate()}
                </span>
              </div>
            ))}

            {hours.map((hour) => (
              <div className="contents" key={hour}>
                <div className="border-b border-r border-neutral-200 bg-neutral-50 p-2 text-xs font-semibold text-neutral-500">
                  {hour}:00
                </div>
                {days.map((day) => {
                  const slot = new Date(day);
                  slot.setHours(hour, 0, 0, 0);
                  const value = toLocalInputValue(slot);
                  const isSelected = selected.has(value);

                  return (
                    <button
                      aria-pressed={isSelected}
                      aria-label={`${day.getMonth() + 1}/${day.getDate()} ${hour}:00 가능`}
                      className={`h-11 border-b border-r border-neutral-200 text-xs transition last:border-r-0 ${
                        isSelected
                          ? "bg-neutral-900 text-transparent hover:bg-neutral-800"
                          : "bg-white text-transparent hover:bg-neutral-100"
                      }`}
                      key={value}
                      onClick={() => toggleSlot(value)}
                      type="button"
                    >
                      선택
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
          <span>겹침 적음</span>
          <div className="flex flex-1 items-center justify-center gap-1">
            <span className="h-3 w-10 rounded-sm bg-neutral-200" />
            <span className="h-3 w-10 rounded-sm bg-neutral-400" />
            <span className="h-3 w-10 rounded-sm bg-neutral-700" />
            <span className="h-3 w-10 rounded-sm bg-neutral-950" />
          </div>
          <span>겹침 많음</span>
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
