import {
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  MapPin,
  PenLine,
  RotateCcw,
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

function getWeekOptions(posts: HomePost[], selectedWeek: string) {
  return Array.from(new Set([selectedWeek, ...posts.map((post) => post.week_start)])).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );
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
  const weekOptions = getWeekOptions(posts, selectedWeek);
  const postsForWeek = posts.filter((post) => post.week_start === selectedWeek);
  const postsByAuthor = new Map(postsForWeek.map((post) => [post.author_id, post]));
  const myPost = currentUserId ? postsByAuthor.get(currentUserId) ?? null : null;
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
            <Link
              className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
              href={myPost ? `/posts/${myPost.id}/edit` : `/posts/new?group=${group.id}`}
            >
              <PenLine size={16} />
              {myPost ? "내 기록 수정" : "기록 작성"}
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

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500">내 이번 주 기록</p>
            {myPost ? (
              <>
                <Link className="mt-1 block text-lg font-semibold hover:underline" href={`/posts/${myPost.id}`}>
                  {myPost.title}
                </Link>
                <p className="mt-1 text-sm text-neutral-600">이미 등록했습니다. 필요하면 수정만 하면 됩니다.</p>
              </>
            ) : (
              <>
                <p className="mt-1 text-lg font-semibold text-neutral-900">아직 등록하지 않았습니다</p>
                <p className="mt-1 text-sm text-neutral-600">모임 전에 이번 주 진행 내용을 남겨주세요.</p>
              </>
            )}
          </div>
          <Link
            className={`rounded-md px-4 py-2 text-center text-sm font-semibold ${
              myPost
                ? "border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900"
                : "bg-neutral-900 text-white"
            }`}
            href={myPost ? `/posts/${myPost.id}/edit` : `/posts/new?group=${group.id}`}
          >
            {myPost ? "수정" : "작성"}
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500">주차</p>
            <h2 className="mt-1 text-xl font-semibold">{formatWeekLabel(selectedWeek)}</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weekOptions.map((week) => (
              <Link
                className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold ${
                  week === selectedWeek
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                }`}
                href={`/?group=${group.id}&week=${week}`}
                key={week}
              >
                {week === selectedWeek ? "선택됨 · " : ""}
                {formatWeekLabel(week)}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {group.members.map((member) => {
            const post = postsByAuthor.get(member.userId);

            return (
              <article
                className="rounded-lg border border-neutral-200 bg-white p-5"
                key={member.userId}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
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
                    </div>
                  </div>

                  {post ? (
                    <Link
                      className="rounded-md border border-neutral-200 px-3 py-2 text-center text-sm font-semibold text-neutral-700 hover:border-neutral-900"
                      href={`/posts/${post.id}`}
                    >
                      글 보기
                    </Link>
                  ) : null}
                </div>

                {post ? (
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <Link className="text-lg font-semibold hover:underline" href={`/posts/${post.id}`}>
                      {post.title}
                    </Link>
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

      <details className="group rounded-lg border border-neutral-200 bg-white p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-sm font-semibold text-neutral-500">자세히 보기</p>
            <p className="mt-1 text-sm text-neutral-700">모임, 응답, 주차 현황</p>
          </div>
          <ChevronDown className="text-neutral-500 transition group-open:rotate-180" size={18} />
        </summary>

        <div className="mt-4 grid gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md bg-neutral-50 p-3">
            <p className="text-xs font-semibold text-neutral-500">모임</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">{formatMeeting(group)}</p>
            <p className="mt-1 text-xs text-neutral-500">{formatLocation(group)}</p>
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
            <p className="text-xs font-semibold text-neutral-500">이번 주 등록</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {postsForWeek.length}/{group.members.length}명
            </p>
            <p className="mt-1 text-xs text-neutral-500">선택한 주차 기준</p>
          </div>
          <div className="rounded-md bg-neutral-50 p-3">
            <p className="text-xs font-semibold text-neutral-500">피드백</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              댓글 {totalCommentCount} · 반응 {totalReactionCount}
            </p>
            <p className="mt-1 text-xs text-neutral-500">익명으로 저장</p>
          </div>
        </div>
      </details>
    </div>
  );
}
