import {
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RotateCcw,
  Settings,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { HomeGroup, HomePost } from "@/app/home-data";
import type { RescheduleOverview } from "@/app/sessions/reschedule/data";
import Link from "next/link";

const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function formatMeeting(group: HomeGroup) {
  if (group.default_meeting_day === null && !group.default_meeting_time) {
    return "모임 일정 미정";
  }

  const day =
    group.default_meeting_day === null ? "요일 미정" : weekdays[group.default_meeting_day] ?? "요일 미정";
  const time = group.default_meeting_time?.slice(0, 5) ?? "시간 미정";
  return `${day} ${time}`;
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

function formatWeekLabel(weekStart: string) {
  const date = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "주차 미정";

  return `${date.getMonth() + 1}월 ${date.getDate()}일 주`;
}

function getCurrentWeekStart(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(result.getDate() - day);
  result.setHours(12, 0, 0, 0);

  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(result.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

function getWeekOfMonth(date: Date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function formatWeekHeading(weekStart: string) {
  const date = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "주차 미정";

  const prefix = weekStart === getCurrentWeekStart() ? "이번 주 " : "";
  return `${prefix}${date.getMonth() + 1}월 ${getWeekOfMonth(date)}주차(${date.getDate()}일)`;
}

function getNextMeetingDate(group: HomeGroup) {
  if (group.default_meeting_day === null || !group.default_meeting_time) {
    return null;
  }

  const [hour, minute] = group.default_meeting_time.split(":").map(Number);
  const now = new Date();
  const meeting = new Date(now);
  const diff = (group.default_meeting_day - now.getDay() + 7) % 7;
  meeting.setDate(now.getDate() + diff);
  meeting.setHours(hour || 0, minute || 0, 0, 0);

  if (meeting <= now) {
    meeting.setDate(meeting.getDate() + 7);
  }

  return meeting;
}

function formatRemainingMeeting(group: HomeGroup) {
  const meeting = getNextMeetingDate(group);
  if (!meeting) return "모임까지 남은 시간 미정";

  const totalHours = Math.max(0, Math.ceil((meeting.getTime() - Date.now()) / (1000 * 60 * 60)));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days === 0) return `모임까지 ${hours}시간`;
  if (hours === 0) return `모임까지 ${days}일`;
  return `모임까지 ${days}일 ${hours}시간`;
}

function getExcerpt(markdown: string) {
  return markdown
    .replace(/[#>*_`-]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 120);
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function addWeeks(weekStart: string, amount: number) {
  const [year, month, day] = weekStart.split("-").map(Number);
  if (!year || !month || !day) return weekStart;

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + amount * 7);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getStudyStartWeek(group: HomeGroup) {
  return getCurrentWeekStart(new Date(group.created_at));
}

function clampWeek(weekStart: string, minWeek: string, maxWeek: string) {
  if (weekStart < minWeek) return minWeek;
  if (weekStart > maxWeek) return maxWeek;
  return weekStart;
}

export function GroupWorkspace({
  currentUserId,
  group,
  posts,
  rescheduleOverview,
  selectedWeek,
}: {
  currentUserId: string | null;
  group: HomeGroup;
  posts: HomePost[];
  rescheduleOverview: RescheduleOverview;
  selectedWeek: string;
}) {
  const studyStartWeek = getStudyStartWeek(group);
  const currentWeek = getCurrentWeekStart();
  const visibleWeek = clampWeek(selectedWeek, studyStartWeek, currentWeek);
  const postsForWeek = posts.filter((post) => post.week_start === visibleWeek);
  const postsByAuthor = new Map(postsForWeek.map((post) => [post.author_id, post]));
  const availability = rescheduleOverview?.availability ?? [];
  const hasVoted = availability.some((slot) => slot.selectedByMe);
  const isRescheduling = rescheduleOverview?.status === "rescheduling";
  const topAvailability = availability
    .filter((slot) => slot.count > 0)
    .sort((a, b) => b.count - a.count || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  const totalCommentCount = postsForWeek.reduce(
    (sum, post) => sum + post.anonymous_comments.length,
    0,
  );
  const totalReactionCount = postsForWeek.reduce(
    (sum, post) => sum + post.anonymous_reactions.length,
    0,
  );
  const groupWeekHref = `/?group=${group.id}&week=${visibleWeek}`;
  const previousWeek = addWeeks(visibleWeek, -1);
  const nextWeek = addWeeks(visibleWeek, 1);
  const canGoPrevious = visibleWeek > studyStartWeek;
  const canGoNext = visibleWeek < currentWeek;
  const isOwner = group.currentUserRole === "owner";
  const detailsGrid = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-md bg-neutral-50 p-3">
        <p className="text-xs font-semibold text-neutral-500">모임</p>
        <p className="mt-1 text-sm font-semibold text-neutral-900">{formatMeeting(group)}</p>
        <p className="mt-1 text-xs text-neutral-500">
          {formatRemainingMeeting(group)} · {formatLocation(group)}
        </p>
      </div>
      <div className="rounded-md bg-neutral-50 p-3">
        <p className="text-xs font-semibold text-neutral-500">일정 응답</p>
        <p className="mt-1 text-sm font-semibold text-neutral-900">
          {rescheduleOverview?.responderCount ?? 0}명 응답
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {topAvailability
            ? `최다 ${new Date(topAvailability.startsAt).toLocaleString("ko-KR", {
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                month: "numeric",
                weekday: "short",
              })}`
            : "후보 시간 없음"}
        </p>
      </div>
      <div className="rounded-md bg-neutral-50 p-3">
        <p className="text-xs font-semibold text-neutral-500">주차 등록</p>
        <p className="mt-1 text-sm font-semibold text-neutral-900">
          {postsForWeek.length}/{group.members.length}명
        </p>
        <p className="mt-1 text-xs text-neutral-500">{formatWeekLabel(visibleWeek)} 기준</p>
      </div>
      <div className="rounded-md bg-neutral-50 p-3">
        <p className="text-xs font-semibold text-neutral-500">피드백</p>
        <p className="mt-1 text-sm font-semibold text-neutral-900">
          댓글 {totalCommentCount} · 반응 {totalReactionCount}
        </p>
        <p className="mt-1 text-xs text-neutral-500">익명으로 저장</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="border-b border-neutral-200 pb-6">
        <Link
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
          href="/"
        >
          <ChevronLeft size={16} />
          스터디 목록
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500">그룹</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">{group.name}</h1>
            {group.default_location_note ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                {group.default_location_note}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-600">
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5">
                <CalendarClock size={15} />
                {formatMeeting(group)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5">
                {formatRemainingMeeting(group)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5">
                <MapPin size={15} />
                {formatLocation(group)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5">
                <UsersRound size={15} />
                {group.members.length}명
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner ? (
              <Link
                className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
                href={`/?group=${group.id}&week=${visibleWeek}&modal=group-settings`}
              >
                <Settings size={16} />
                설정
              </Link>
            ) : null}
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
              href={`/?group=${group.id}&week=${visibleWeek}&modal=invite`}
            >
              <UserPlus size={16} />
              초대
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
              href={`/?group=${group.id}&modal=reschedule`}
            >
              <RotateCcw size={16} />
              일정 재조율
            </Link>
          </div>
        </div>

        <details className="group mt-5 rounded-lg border border-neutral-200 bg-white p-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-sm font-semibold text-neutral-500">자세히 보기</p>
              <p className="mt-1 text-sm text-neutral-700">모임, 응답, 주차 현황</p>
            </div>
            <ChevronDown className="text-neutral-500 transition group-open:rotate-180" size={18} />
          </summary>
          <div className="mt-4 border-t border-neutral-100 pt-4">{detailsGrid}</div>
        </details>

        <div className="mt-5 hidden lg:block">{detailsGrid}</div>
      </section>

      {isRescheduling ? (
        <section className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800">
                <RotateCcw size={16} />
                일정 재조율 투표가 진행 중입니다
              </p>
              <p className="mt-1 text-sm leading-6 text-teal-800">
                {hasVoted
                  ? "내 가능한 시간은 등록되어 있습니다. 다른 멤버의 응답을 기다리는 중입니다."
                  : "가능한 시간을 선택해야 이번 주 모임 시간을 다시 정할 수 있습니다."}
                {rescheduleOverview?.reason ? ` 사유: ${rescheduleOverview.reason}` : ""}
              </p>
            </div>
            <Link
              className="rounded-md bg-teal-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-teal-800"
              href={`/?group=${group.id}&modal=reschedule`}
            >
              {hasVoted ? "투표 수정" : "투표하기"}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500">주차</p>
            <h2 className="mt-1 text-xl font-semibold">{formatWeekHeading(visibleWeek)}</h2>
          </div>
          <div className="flex items-center gap-2 pb-1">
            {canGoPrevious ? (
              <Link
                aria-label="이전 주"
                className="inline-flex size-10 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                href={`/?group=${group.id}&week=${previousWeek}`}
              >
                <ChevronLeft size={15} />
              </Link>
            ) : (
              <span
                aria-label="이전 주 없음"
                className="inline-flex size-10 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-300"
              >
                <ChevronLeft size={15} />
              </span>
            )}
            <div className="min-w-44 rounded-md border border-neutral-200 bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-900">
              {formatWeekHeading(visibleWeek)}
            </div>
            {canGoNext ? (
              <Link
                aria-label="다음 주"
                className="inline-flex size-10 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                href={`/?group=${group.id}&week=${nextWeek}`}
              >
                <ChevronRight size={15} />
              </Link>
            ) : (
              <span
                aria-label="다음 주 없음"
                className="inline-flex size-10 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-300"
              >
                <ChevronRight size={15} />
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {group.members.map((member) => {
            const post = postsByAuthor.get(member.userId);
            const isMe = member.userId === currentUserId;
            const postHref = post
              ? `/posts/${post.id}?from=${encodeURIComponent(groupWeekHref)}`
              : null;

            return (
              <article
                className={`relative rounded-lg border border-neutral-200 bg-white p-5 ${
                  post ? "transition hover:border-neutral-400" : ""
                }`}
                key={member.userId}
              >
                {postHref ? (
                  <Link
                    aria-label={`${member.nickname} 공유글 보기`}
                    className="absolute inset-0 z-10 rounded-lg"
                    href={postHref as never}
                  />
                ) : null}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="pointer-events-none relative z-20 flex min-w-0 items-start gap-3">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        post ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {getInitial(member.nickname)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">{member.nickname}</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {post ? "이번 주 등록 완료" : "이번 주 등록글 없음"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        누적 미참여 {member.missedCount}회
                      </p>
                    </div>
                  </div>

                  {isMe ? (
                    <Link
                      className={`pointer-events-auto relative z-30 rounded-md px-3 py-2 text-center text-sm font-semibold ${
                        post
                          ? "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900"
                          : "bg-neutral-900 text-white"
                      }`}
                      href={post ? `/posts/${post.id}/edit` : `/posts/new?group=${group.id}`}
                    >
                      {post ? "수정" : "작성"}
                    </Link>
                  ) : null}
                </div>

                {post ? (
                  <div className="pointer-events-none relative z-20 mt-4 border-t border-neutral-100 pt-4">
                    <p className="text-lg font-semibold">{post.title}</p>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {getExcerpt(post.body_markdown)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-neutral-500">
                      <span>익명 댓글 {post.anonymous_comments.length}</span>
                      <span>익명 반응 {post.anonymous_reactions.length}</span>
                      {post.post_links.length > 0 ? <span>링크 {post.post_links.length}</span> : null}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
