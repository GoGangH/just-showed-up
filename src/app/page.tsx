import { AppModal } from "@/components/AppModal";
import { GroupInvitePanel } from "@/components/GroupInvitePanel";
import { GroupList } from "@/components/GroupList";
import { GroupWorkspace } from "@/components/GroupWorkspace";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileMenu } from "@/components/ProfileMenu";
import { GroupJoinForm } from "@/app/groups/join/GroupJoinForm";
import { GroupCreateForm } from "@/app/groups/new/GroupCreateForm";
import { GroupLeaveForm } from "@/app/groups/leave/GroupLeaveForm";
import { GroupSettingsForm } from "@/app/groups/settings/GroupSettingsForm";
import { LoginForm } from "@/app/login/LoginForm";
import { getRescheduleOverview } from "@/app/sessions/reschedule/data";
import { RescheduleForm } from "@/app/sessions/reschedule/RescheduleForm";
import { getHeaderNotifications } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWeekStart } from "@/lib/dates/week";
import { buildLoginHref, getSafeRedirectPath } from "@/lib/redirects";
import { getRequestOrigin } from "@/lib/site-url";
import { Plus } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { getHomeData } from "./home-data";

type HomeProps = {
  searchParams: Promise<{
    group?: string;
    modal?: string;
    next?: string;
    week?: string;
    invite?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { group, invite, modal, next, week } = await searchParams;
  const requestHeaders = await headers();
  const origin = getRequestOrigin(requestHeaders);
  const selectedWeek = week ?? getCurrentWeekStart();
  const homeData = await getHomeData(group, selectedWeek);
  const activeGroup = group ? homeData.groups.find((item) => item.id === group) ?? null : null;
  const isSignedIn = Boolean(homeData.user);
  const displayName =
    homeData.user?.name ?? homeData.user?.email?.split("@")[0] ?? "사용자";
  const [notificationData, rescheduleOverview] = await Promise.all([
    homeData.user
      ? getHeaderNotifications(await createClient(), homeData.user.id)
      : Promise.resolve({ notifications: [], unreadCount: 0 }),
    homeData.user && activeGroup
      ? getRescheduleOverview(activeGroup.id)
      : Promise.resolve({
          availability: [],
          reason: null,
          responderCount: 0,
          scheduledAt: null,
          status: "none" as const,
        }),
  ]);
  const currentPath = activeGroup ? `/?group=${activeGroup.id}&week=${selectedWeek}` : "/";
  const loginNextPath = getSafeRedirectPath(next, currentPath);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/">
            <div>
              <p className="text-xl font-bold">일단옴</p>
              <p className="text-xs text-neutral-600">쉬었음청년 스터디</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {homeData.user ? (
              <>
                <Link
                  className="hidden rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900 sm:inline-flex"
                  href="/?modal=new-group"
                >
                  그룹 만들기
                </Link>
                <Link
                  className="hidden rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900 sm:inline-flex"
                  href="/?modal=join-group"
                >
                  초대 참여
                </Link>
                <NotificationBell
                  notifications={notificationData.notifications}
                  unreadCount={notificationData.unreadCount}
                />
                <ProfileMenu
                  avatarUrl={homeData.user.avatarUrl}
                  displayName={displayName}
                  profileHref={
                    activeGroup
                      ? `/?group=${activeGroup.id}&modal=profile`
                      : "/?modal=profile"
                  }
                />
              </>
            ) : (
              <>
                <Link
                  className="hidden items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900 sm:inline-flex"
                  href={buildLoginHref("/?modal=new-group") as never}
                >
                  <Plus size={16} />
                  그룹 만들기
                </Link>
                <Link className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white" href={buildLoginHref(currentPath) as never}>
                  로그인
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
          <div className="space-y-6">
            {!activeGroup ? (
            <section className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-500">
                    {homeData.user ? "내 스터디" : "서비스 준비"}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                    {homeData.user ? "스터디 목록" : "쉬었음청년 스터디"}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                    참여 중인 스터디를 선택하면 모임 일정과 주차별 기록을 볼 수 있습니다.
                  </p>
                </div>
              </div>
            </section>
            ) : null}

            {!homeData.configured ? (
              <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                <p className="font-semibold">Supabase 연결 정보가 필요합니다.</p>
                <p className="mt-1">
                  `.env.local`에 Supabase URL과 publishable key를 설정하면 로그인과 그룹 기능을 사용할 수
                  있습니다.
                </p>
              </section>
            ) : null}

            {homeData.error ? (
              <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
                {homeData.error}
              </section>
            ) : null}

            {homeData.user && homeData.groups.length === 0 ? (
              <section className="rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="text-xl font-semibold">아직 참여한 그룹이 없습니다</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  새 스터디 그룹을 만들거나 받은 초대 코드로 기존 그룹에 참여하세요.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link
                    className="rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-semibold text-white"
                    href="/?modal=new-group"
                  >
                    그룹 만들기
                  </Link>
                  <Link
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-700"
                    href="/?modal=join-group"
                  >
                    초대 코드 참여
                  </Link>
                </div>
              </section>
            ) : null}

            {activeGroup ? (
              <GroupWorkspace
                currentUserId={homeData.user?.id ?? null}
                group={activeGroup}
                posts={homeData.posts}
                rescheduleOverview={rescheduleOverview}
                selectedWeek={selectedWeek}
              />
            ) : (
              <GroupList
                activeGroupId={null}
                groups={homeData.groups}
                isSignedIn={isSignedIn}
              />
            )}
          </div>
      </div>

      {modal === "login" ? (
        <AppModal
          closeHref={activeGroup ? `/?group=${activeGroup.id}&week=${selectedWeek}` : "/"}
          description="OAuth 계정으로 로그인하고 그룹의 주간 기록과 모임 일정을 관리합니다."
          size="sm"
          title="로그인"
        >
          <LoginForm nextPath={loginNextPath} />
        </AppModal>
      ) : null}

      {modal === "new-group" ? (
        <AppModal
          closeHref={activeGroup ? `/?group=${activeGroup.id}&week=${selectedWeek}` : "/"}
          description={
            homeData.user
              ? "기본 모임 시간과 장소를 설정해두면 매주 같은 기준으로 스터디를 운영할 수 있습니다."
              : "그룹을 만들려면 먼저 OAuth 계정으로 로그인해주세요."
          }
          title={homeData.user ? "그룹 만들기" : "로그인"}
        >
          {homeData.user ? (
            <GroupCreateForm />
          ) : (
            <LoginForm nextPath="/?modal=new-group" />
          )}
        </AppModal>
      ) : null}

      {modal === "join-group" ? (
        <AppModal
          closeHref={activeGroup ? `/?group=${activeGroup.id}&week=${selectedWeek}` : "/"}
          description={
            homeData.user
              ? "그룹 관리자에게 받은 초대 코드를 입력하면 스터디 그룹에 참여할 수 있습니다."
              : "초대 코드로 참여하려면 먼저 OAuth 계정으로 로그인해주세요."
          }
          title={homeData.user ? "초대 코드로 참여" : "로그인"}
        >
          {homeData.user ? (
            <GroupJoinForm defaultInviteCode={invite ?? ""} />
          ) : (
            <LoginForm
              nextPath={`/?modal=join-group${invite ? `&invite=${encodeURIComponent(invite)}` : ""}`}
            />
          )}
        </AppModal>
      ) : null}

      {modal === "invite" && activeGroup ? (
        <AppModal
          closeHref={`/?group=${activeGroup.id}&week=${selectedWeek}`}
          description="초대 코드를 복사하거나 공유 앱으로 보내서 새 멤버를 초대합니다."
          size="sm"
          title="그룹 초대"
        >
          <GroupInvitePanel
            groupName={activeGroup.name}
            inviteCode={activeGroup.invite_code}
            inviteUrl={`${origin}/?modal=join-group&invite=${encodeURIComponent(activeGroup.invite_code)}`}
          />
        </AppModal>
      ) : null}

      {modal === "group-settings" && activeGroup ? (
        <AppModal
          closeHref={`/?group=${activeGroup.id}&week=${selectedWeek}`}
          description="그룹의 고정 모임 요일, 시간, 장소를 수정합니다."
          title="그룹 설정"
        >
          {activeGroup.currentUserRole === "owner" ? (
            <GroupSettingsForm group={activeGroup} week={selectedWeek} />
          ) : (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              그룹장만 모임 정보를 수정할 수 있습니다.
            </p>
          )}
        </AppModal>
      ) : null}

      {modal === "reschedule" ? (
        <AppModal
          closeHref={activeGroup ? `/?group=${activeGroup.id}&week=${selectedWeek}` : "/"}
          description={
            homeData.user
              ? "이번 주 가능한 시간을 칠해두면 그룹원이 겹치는 시간을 기준으로 모임을 다시 잡을 수 있습니다."
              : "일정을 재조율하려면 먼저 OAuth 계정으로 로그인해주세요."
          }
          size={homeData.user && activeGroup ? "lg" : "sm"}
          title={homeData.user ? "이번 주 일정 재조율" : "로그인"}
        >
          {homeData.user && activeGroup ? (
            <RescheduleForm
              availability={rescheduleOverview.availability}
              defaultMeetingDay={activeGroup.default_meeting_day}
              groupId={activeGroup.id}
            />
          ) : (
            <LoginForm />
          )}
        </AppModal>
      ) : null}

      {modal === "profile" && homeData.user ? (
        <AppModal closeHref={activeGroup ? `/?group=${activeGroup.id}&week=${selectedWeek}` : "/"} title="내 정보" size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {homeData.user.avatarUrl ? (
                <img
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  src={homeData.user.avatarUrl}
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
                  {displayName.trim().slice(0, 1).toUpperCase() || "?"}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-900">{displayName}</p>
                <p className="truncate text-sm text-neutral-500">
                  {homeData.user.email ?? "이메일 정보 없음"}
                </p>
              </div>
            </div>
            <Link
              className="block rounded-md border border-neutral-200 px-3 py-2 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              href="/logout"
            >
              로그아웃
            </Link>
            {activeGroup ? (
              <GroupLeaveForm groupId={activeGroup.id} groupName={activeGroup.name} />
            ) : null}
          </div>
        </AppModal>
      ) : null}
    </main>
  );
}
