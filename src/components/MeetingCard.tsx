import { CalendarClock, MapPin, RotateCcw, UsersRound } from "lucide-react";
import type { HomeGroup } from "@/app/home-data";
import type { AvailabilitySummary } from "@/app/sessions/reschedule/data";
import Link from "next/link";

const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const shortWeekdays = ["일", "월", "화", "수", "목", "금", "토"];

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

function formatSlotLabel(startsAt: string) {
  const date = new Date(startsAt);
  const weekday = shortWeekdays[date.getDay()] ?? "";
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${weekday} ${hour}:${minute}`;
}

function getTopSlots(availability: AvailabilitySummary[]) {
  return availability
    .filter((slot) => slot.count > 0)
    .sort((a, b) => b.count - a.count || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 4);
}

export function MeetingCard({
  availability,
  group,
  responderCount,
}: {
  availability: AvailabilitySummary[];
  group: HomeGroup;
  responderCount: number;
}) {
  const topSlots = getTopSlots(availability);
  const bestCount = topSlots[0]?.count ?? 0;

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
            href={`/?group=${group.id}&modal=reschedule`}
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
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700">
            <UsersRound size={15} /> {responderCount}명 응답
          </span>
        </div>
        {topSlots.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {topSlots.map((slot) => (
              <div
                className={`rounded-md border px-3 py-2 text-left text-sm ${
                  slot.count === bestCount
                    ? "border-teal-500 bg-white text-teal-700"
                    : "border-neutral-200 bg-white text-neutral-700"
                }`}
                key={slot.startsAt}
              >
                <span className="block font-semibold">{formatSlotLabel(slot.startsAt)}</span>
                <span className="text-xs">{slot.count}명 가능</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-dashed border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-600">
            아직 등록된 후보 시간이 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
