"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { startRescheduleAction, type SessionFormState } from "../actions";

const initialState: SessionFormState = {};
const timeSlots = Array.from({ length: 30 }, (_, index) => {
  const totalMinutes = 9 * 60 + index * 30;
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  };
});
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const availabilityColors = [
  "#ccfbf1",
  "#99f6e4",
  "#5eead4",
  "#2dd4bf",
  "#14b8a6",
  "#0d9488",
  "#0f766e",
  "#115e59",
  "#134e4a",
  "#042f2e",
];
type DragMode = "select" | "clear" | null;

function toLocalInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatHourLabel(hour: number, minute: number) {
  if (minute !== 0) return "";
  return `${hour}시`;
}

function buildDays(defaultMeetingDay?: number | null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasMeetingDay =
    typeof defaultMeetingDay === "number" && defaultMeetingDay >= 0 && defaultMeetingDay <= 6;
  const dayCount = hasMeetingDay ? ((defaultMeetingDay - today.getDay() + 7) % 7) + 1 : 5;

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

function buildDemoCounts(days: Date[]) {
  const counts = new Map<string, number>();

  days.slice(1, 4).forEach((day, dayIndex) => {
    [
      [10, 0, 1 + dayIndex],
      [10, 30, 2 + dayIndex],
      [11, 0, 3],
      [11, 30, 2],
    ].forEach(([hour, minute, count]) => {
      const slot = new Date(day);
      slot.setHours(hour, minute, 0, 0);
      counts.set(toLocalInputValue(slot), count);
    });
  });

  return counts;
}

function getAvailabilityColor(count: number) {
  if (count <= 0) return undefined;
  return availabilityColors[Math.min(count, availabilityColors.length) - 1];
}

function getCellBorderColor(count: number, minute: number) {
  if (count <= 0) return minute === 0 ? "#e5e5e5" : "#f5f5f5";

  return "rgba(15, 118, 110, 0.18)";
}

function buildSelectionShadow({
  dayIndex,
  days,
  selected,
  slotIndex,
}: {
  dayIndex: number;
  days: Date[];
  selected: Set<string>;
  slotIndex: number;
}) {
  const shadows: string[] = [];
  const outlineColor = "#0f766e";

  function isSelectedAt(nextSlotIndex: number, nextDayIndex: number) {
    const timeSlot = timeSlots[nextSlotIndex];
    const day = days[nextDayIndex];
    if (!timeSlot || !day) return false;

    const slot = new Date(day);
    slot.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
    return selected.has(toLocalInputValue(slot));
  }

  if (!isSelectedAt(slotIndex - 1, dayIndex)) shadows.push(`inset 0 1px 0 ${outlineColor}`);
  if (!isSelectedAt(slotIndex + 1, dayIndex)) shadows.push(`inset 0 -1px 0 ${outlineColor}`);
  if (!isSelectedAt(slotIndex, dayIndex - 1)) shadows.push(`inset 1px 0 0 ${outlineColor}`);
  if (!isSelectedAt(slotIndex, dayIndex + 1)) shadows.push(`inset -1px 0 0 ${outlineColor}`);

  return shadows.join(", ");
}

export function RescheduleForm({
  defaultMeetingDay = null,
  groupId,
}: {
  defaultMeetingDay?: number | null;
  groupId: string;
}) {
  const [state, formAction, pending] = useActionState(startRescheduleAction, initialState);
  const days = useMemo(() => buildDays(defaultMeetingDay), [defaultMeetingDay]);
  const existingCounts = useMemo(() => buildDemoCounts(days), [days]);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const maxVisibleCount = useMemo(() => {
    let maxCount = 0;

    days.forEach((day) => {
      timeSlots.forEach(({ hour, minute }) => {
        const slot = new Date(day);
        slot.setHours(hour, minute, 0, 0);
        const value = toLocalInputValue(slot);
        const count = (existingCounts.get(value) ?? 0) + (selected.has(value) ? 1 : 0);
        maxCount = Math.max(maxCount, count);
      });
    });

    return Math.min(Math.max(maxCount, 1), availabilityColors.length);
  }, [days, existingCounts, selected]);

  useEffect(() => {
    function stopDragging() {
      setDragMode(null);
    }

    window.addEventListener("pointerup", stopDragging);
    return () => window.removeEventListener("pointerup", stopDragging);
  }, []);

  function setSlot(value: string, shouldSelect: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (shouldSelect) {
        next.add(value);
      } else {
        next.delete(value);
      }
      return next;
    });
  }

  function startDrag(value: string, isSelected: boolean) {
    const nextMode: DragMode = isSelected ? "clear" : "select";
    setDragMode(nextMode);
    setSlot(value, nextMode === "select");
  }

  function paintDuringDrag(value: string) {
    if (!dragMode) return;
    setSlot(value, dragMode === "select");
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
              다른 사람이 선택한 시간은 미리 칠해져 있고, 그 위에 내 가능 시간을 칠하면 인원수만큼 색이 진해집니다.
            </p>
          </div>
          <p className="text-sm font-semibold text-neutral-700">{selected.size}개 선택</p>
        </div>

        <div className="mt-3 max-h-[430px] overflow-auto rounded-md border border-neutral-200">
          <div className="grid min-w-[420px] select-none grid-cols-[44px_repeat(5,minmax(58px,1fr))]">
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

            {timeSlots.map(({ hour, minute }, slotIndex) => (
              <div className="contents" key={`${hour}:${minute}`}>
                <div className="border-r border-neutral-200 bg-neutral-50 px-2 text-xs font-semibold leading-4 text-neutral-500">
                  {formatHourLabel(hour, minute)}
                </div>
                {days.map((day, dayIndex) => {
                  const slot = new Date(day);
                  slot.setHours(hour, minute, 0, 0);
                  const value = toLocalInputValue(slot);
                  const isSelected = selected.has(value);
                  const existingCount = existingCounts.get(value) ?? 0;
                  const visibleCount = existingCount + (isSelected ? 1 : 0);
                  const timeLabel = formatTime(hour, minute);

                  return (
                    <button
                      aria-pressed={isSelected}
                      aria-label={`${day.getMonth() + 1}/${day.getDate()} ${timeLabel}, ${visibleCount}명 가능`}
                      className={`h-4 border-r border-t transition last:border-r-0 ${
                        visibleCount > 0 ? "hover:brightness-95" : "bg-white hover:bg-teal-50"
                      }`}
                      key={value}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        startDrag(value, isSelected);
                      }}
                      onPointerEnter={() => paintDuringDrag(value)}
                      style={{
                        backgroundColor: getAvailabilityColor(visibleCount),
                        borderColor: getCellBorderColor(visibleCount, minute),
                        boxShadow: isSelected
                          ? buildSelectionShadow({ dayIndex, days, selected, slotIndex })
                          : undefined,
                      }}
                      type="button"
                    >
                      <span className="sr-only">선택</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-700">색상 기준</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Array.from({ length: maxVisibleCount }, (_, index) => {
              const count = index + 1;
              return (
                <span className="inline-flex items-center gap-2" key={count}>
                  <span
                    className="h-3 w-6 rounded-sm"
                    style={{ backgroundColor: availabilityColors[index] }}
                  />
                  {count}명 가능
                </span>
              );
            })}
          </div>
          <p className="mt-2">후보 시간이 없으면 아무 칸도 선택하지 않고 저장할 수 있습니다.</p>
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
