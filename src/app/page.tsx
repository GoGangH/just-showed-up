import { ClientHomeModals } from "@/components/ClientHomeModals";
import { GroupList } from "@/components/GroupList";
import { GroupWorkspace } from "@/components/GroupWorkspace";
import { ModalTrigger } from "@/components/ModalTrigger";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileMenu } from "@/components/ProfileMenu";
import { getRescheduleOverview } from "@/app/sessions/reschedule/data";
import { getHeaderNotifications } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWeekStart } from "@/lib/dates/week";
import { getSafeRedirectPath } from "@/lib/redirects";
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
  const includeActivePosts = true;
  const homeData = await getHomeData(group, selectedWeek, { includeActivePosts });
  const activeGroup = group ? homeData.groups.find((item) => item.id === group) ?? null : null;
  const isSignedIn = Boolean(homeData.user);
  const displayName =
    homeData.user?.name ?? homeData.user?.email?.split("@")[0] ?? "사용자";
  const sharedSupabase = homeData.user ? await createClient() : null;
  const shouldLoadRescheduleOverview = Boolean(
    homeData.user && activeGroup && (!modal || modal === "reschedule"),
  );
  const [notificationData, rescheduleOverview] = await Promise.all([
    homeData.user && sharedSupabase
      ? getHeaderNotifications(sharedSupabase, homeData.user.id)
      : Promise.resolve({ notifications: [], unreadCount: 0 }),
    shouldLoadRescheduleOverview && homeData.user && activeGroup && sharedSupabase
      ? getRescheduleOverview(activeGroup.id, { supabase: sharedSupabase, userId: homeData.user.id })
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
  const inviteUrl = activeGroup
    ? `${origin}/?modal=join-group&invite=${encodeURIComponent(activeGroup.invite_code)}`
    : null;

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
                <ModalTrigger
                  className="hidden rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900 sm:inline-flex"
                  modal="new-group"
                >
                  그룹 만들기
                </ModalTrigger>
                <ModalTrigger
                  className="hidden rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900 sm:inline-flex"
                  modal="join-group"
                >
                  초대 참여
                </ModalTrigger>
                <NotificationBell
                  notifications={notificationData.notifications}
                  unreadCount={notificationData.unreadCount}
                />
                <ProfileMenu
                  avatarUrl={homeData.user.avatarUrl}
                  displayName={displayName}
                />
              </>
            ) : (
              <>
                <ModalTrigger
                  className="hidden items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900 sm:inline-flex"
                  modal="new-group"
                >
                  <Plus size={16} />
                  그룹 만들기
                </ModalTrigger>
                <ModalTrigger className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white" modal="login">
                  로그인
                </ModalTrigger>
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
                  <ModalTrigger
                    className="rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-semibold text-white"
                    modal="new-group"
                  >
                    그룹 만들기
                  </ModalTrigger>
                  <ModalTrigger
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-700"
                    modal="join-group"
                  >
                    초대 코드 참여
                  </ModalTrigger>
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

      <ClientHomeModals
        activeGroup={activeGroup}
        closeHref={currentPath}
        currentUser={homeData.user}
        defaultInviteCode={invite ?? ""}
        displayName={displayName}
        initialModal={modal}
        inviteUrl={inviteUrl}
        loginNextPath={loginNextPath}
        rescheduleOverview={rescheduleOverview}
        selectedWeek={selectedWeek}
      />
    </main>
  );
}
