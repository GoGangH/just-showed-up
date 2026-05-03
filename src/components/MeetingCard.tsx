import { CalendarClock, MapPin, RotateCcw, UsersRound } from "lucide-react";
import type { HomeGroup } from "@/app/home-data";
import Link from "next/link";

const slots = [
  { label: "월 20:00", count: 3 },
  { label: "화 21:00", count: 5 },
  { label: "수 21:00", count: 4 },
  { label: "목 20:00", count: 2 },
];

const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function formatMeetingTime(group: HomeGroup) {
  if (group.default_meeting_day === null && !group.default_meeting_time) {
    return "기본 모임 시간 미정";
  }

  const day =
    group.default_meeting_day === null ? "요일 미정" : weekdays[group.default_meeting_day] ?? "요일 미정";
  const time = group.default_meeting_time?.slice(0, 5) ?? "시간 미정";
  return `${day} ${time}`;
}

function formatLocation(group: HomeGroup) {
  if (group.default_location_type === "unset" && !group.default_location_name) {
    return "장소 미정";
  }

  const typeLabel = {
    online: "온라인",
    offline: "오프라인",
    hybrid: "혼합",
    unset: "장소",
  }[group.default_location_type];

  return `${typeLabel} · ${group.default_location_name ?? "장소 미정"}`;
}

export function MeetingCard({ group }: { group: HomeGroup }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">이번 주 모임</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal">{formatMeetingTime(group)}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-3 py-1.5">
              <CalendarClock size={15} />
              5월 둘째 주
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-3 py-1.5">
              <MapPin size={15} />
              {formatLocation(group)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
            참석 가능
          </button>
          <Link
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-700"
            href={`/sessions/reschedule?group=${group.id}`}
          >
            이번 주 어려워요
          </Link>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <RotateCcw size={16} />
              일정 재조율
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              이번 주 참석이 어려운 멤버가 있으면 가능한 시간을 모아 일정을 확정합니다.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <UsersRound size={15} /> 5명 가능
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {slots.map((slot) => (
            <button
              className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                slot.count === 5
                  ? "border-emerald-500 bg-white text-emerald-700"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
              key={slot.label}
            >
              <span className="block font-semibold">{slot.label}</span>
              <span className="text-xs">{slot.count}명 가능</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
