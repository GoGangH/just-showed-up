import { AppHeader } from "@/components/AppHeader";
import { ClientHomeModals } from "@/components/ClientHomeModals";
import { GroupList } from "@/components/GroupList";
import { ModalTrigger } from "@/components/ModalTrigger";
import { getHeaderNotifications } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/redirects";
import { redirect } from "next/navigation";
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
  if (group) {
    const nextParams = new URLSearchParams();
    if (week) nextParams.set("week", week);
    if (modal) nextParams.set("modal", modal);
    if (invite) nextParams.set("invite", invite);
    const query = nextParams.size > 0 ? `?${nextParams.toString()}` : "";
    redirect(`/groups/${group}${query}`);
  }

  const homeData = await getHomeData(undefined, undefined, { includeActivePosts: false });
  const isSignedIn = Boolean(homeData.user);
  const displayName =
    homeData.user?.name ?? homeData.user?.email?.split("@")[0] ?? "사용자";
  const sharedSupabase = homeData.user ? await createClient() : null;
  const notificationData =
    homeData.user && sharedSupabase
      ? await getHeaderNotifications(sharedSupabase, homeData.user.id)
      : { notifications: [], unreadCount: 0 };
  const rescheduleOverview = {
    availability: [],
    reason: null,
    responderCount: 0,
    scheduledAt: null,
    status: "none" as const,
  };
  const currentPath = "/";
  const loginNextPath = getSafeRedirectPath(next, currentPath);

  return (
    <main className="min-h-screen">
      <AppHeader
        avatarUrl={homeData.user?.avatarUrl}
        displayName={displayName}
        isSignedIn={isSignedIn}
        notifications={notificationData.notifications}
        unreadCount={notificationData.unreadCount}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
          <div className="space-y-6">
            <section className="rounded-lg border border-line bg-surface p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-faint">
                    {homeData.user ? "내 스터디" : "서비스 준비"}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                    {homeData.user ? "스터디 목록" : "쉬었음청년 스터디"}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                    참여 중인 스터디를 선택하면 모임 일정과 주차별 기록을 볼 수 있습니다.
                  </p>
                </div>
              </div>
            </section>

            {!homeData.configured ? (
              <section className="rounded-lg border border-sun-border bg-sun-tint p-5 text-sm leading-6 text-sun">
                <p className="font-semibold">Supabase 연결 정보가 필요합니다.</p>
                <p className="mt-1">
                  `.env.local`에 Supabase URL과 publishable key를 설정하면 로그인과 그룹 기능을 사용할 수
                  있습니다.
                </p>
              </section>
            ) : null}

            {homeData.error ? (
              <section className="rounded-lg border border-berry-border bg-berry-tint p-5 text-sm leading-6 text-berry">
                {homeData.error}
              </section>
            ) : null}

            {homeData.user && homeData.groups.length === 0 ? (
              <section className="rounded-lg border border-line bg-surface p-5">
                <h2 className="text-xl font-semibold">아직 참여한 그룹이 없습니다</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  새 스터디 그룹을 만들거나 받은 초대 코드로 기존 그룹에 참여하세요.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <ModalTrigger
                    className="rounded-md bg-accent px-4 py-2 text-center text-sm font-semibold text-inverse"
                    modal="new-group"
                  >
                    그룹 만들기
                  </ModalTrigger>
                  <ModalTrigger
                    className="rounded-md border border-line-strong bg-surface px-4 py-2 text-center text-sm font-semibold text-ink"
                    modal="join-group"
                  >
                    초대 코드 참여
                  </ModalTrigger>
                </div>
              </section>
            ) : null}

            <GroupList
              activeGroupId={null}
              groups={homeData.groups}
              isSignedIn={isSignedIn}
            />
          </div>
      </div>

      <ClientHomeModals
        activeGroup={null}
        closeHref={currentPath}
        currentUser={homeData.user}
        defaultInviteCode={invite ?? ""}
        displayName={displayName}
        initialModal={modal}
        inviteUrl={null}
        loginNextPath={loginNextPath}
        rescheduleOverview={rescheduleOverview}
        selectedWeek=""
      />
    </main>
  );
}
