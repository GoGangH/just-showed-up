import Link from "next/link";
import { Clock3, MapPin, UsersRound } from "lucide-react";
import type { HomeGroup } from "@/app/home-data";
import { buildLoginHref } from "@/lib/redirects";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function getNextMeeting(group: HomeGroup) {
  if (group.default_meeting_day === null || !group.default_meeting_time) {
    return null;
  }

  const [hour, minute] = group.default_meeting_time.split(":").map(Number);
  const now = new Date();
  const next = new Date(now);
  const diff = (group.default_meeting_day - now.getDay() + 7) % 7;
  next.setDate(now.getDate() + diff);
  next.setHours(hour || 0, minute || 0, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 7);
  }

  return next;
}

function formatRemaining(group: HomeGroup) {
  const meeting = getNextMeeting(group);
  if (!meeting) return "모임 시간 미정";

  const diffMs = meeting.getTime() - Date.now();
  const totalHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days === 0) return `${hours}시간 남음`;
  if (hours === 0) return `${days}일 남음`;
  return `${days}일 ${hours}시간 남음`;
}

function formatMeeting(group: HomeGroup) {
  if (group.default_meeting_day === null || !group.default_meeting_time) {
    return "일정 미정";
  }

  return `매주 ${weekdays[group.default_meeting_day]} ${group.default_meeting_time.slice(0, 5)}`;
}

function formatLocation(group: HomeGroup) {
  if (!group.default_location_name) return "장소 미정";

  const typeLabel = {
    online: "온라인",
    offline: "오프라인",
    hybrid: "혼합",
    unset: "장소",
  }[group.default_location_type];

  return `${typeLabel} · ${group.default_location_name}`;
}

export function GroupList({
  groups,
  activeGroupId,
  isSignedIn,
}: {
  groups: HomeGroup[];
  activeGroupId: string | null;
  isSignedIn: boolean;
}) {
  if (!isSignedIn) {
    return (
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-xl font-semibold">스터디 그룹을 시작하세요</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          로그인 후 새 그룹을 만들거나 초대 코드로 기존 그룹에 참여할 수 있습니다.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            className="rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-semibold text-white"
            href={buildLoginHref("/?modal=new-group") as never}
          >
            그룹 만들기
          </Link>
          <Link
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-700"
            href={buildLoginHref("/?modal=join-group") as never}
          >
            초대 코드 참여
          </Link>
        </div>
      </section>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-500">내 그룹</p>
          <h2 className="mt-1 text-xl font-semibold">이번 주 스터디</h2>
        </div>
        <Link className="text-sm font-semibold text-neutral-600 hover:text-neutral-900" href="/?modal=new-group">
          그룹 추가
        </Link>
      </div>

      <div className="grid gap-3">
        {groups.map((group) => {
          const postedCount = group.members.filter((member) => member.postedThisWeek).length;
          const isActive = group.id === activeGroupId;

          return (
            <Link
              className={`block rounded-lg border bg-white p-5 transition hover:border-neutral-400 ${
                isActive ? "border-neutral-900" : "border-neutral-200"
              }`}
              href={`/?group=${group.id}`}
              key={group.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                    <Clock3 size={13} />
                    {formatRemaining(group)}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{group.name}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{formatMeeting(group)}</p>
                </div>
                <div className="min-w-32 text-right text-sm text-neutral-600">
                  <p className="inline-flex items-center justify-end gap-1">
                    <MapPin size={14} />
                    {formatLocation(group)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 8).map((member) => (
                    <div
                      className={`flex size-9 items-center justify-center rounded-full border-2 border-white text-xs font-semibold ${
                        member.postedThisWeek
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                      key={member.userId}
                      title={`${member.nickname}${member.postedThisWeek ? " · 작성 완료" : " · 작성 전"}`}
                    >
                      {getInitial(member.nickname)}
                    </div>
                  ))}
                  {group.members.length === 0 ? (
                    <div className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                      <UsersRound size={15} />
                    </div>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-neutral-700">
                  {postedCount}/{group.members.length} 작성
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
