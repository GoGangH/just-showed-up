import { AppHeader } from "@/components/AppHeader";
import { ClientHomeModals } from "@/components/ClientHomeModals";
import { GroupWorkspace } from "@/components/GroupWorkspace";
import { getHomeData } from "@/app/home-data";
import { getRescheduleOverview } from "@/app/sessions/reschedule/data";
import { getCurrentWeekStart } from "@/lib/dates/week";
import { getHeaderNotifications } from "@/lib/notifications";
import { getSafeRedirectPath } from "@/lib/redirects";
import { getRequestOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

type GroupPageProps = {
  params: Promise<{
    groupId: string;
  }>;
  searchParams: Promise<{
    invite?: string;
    modal?: string;
    next?: string;
    week?: string;
  }>;
};

export default async function GroupPage({ params, searchParams }: GroupPageProps) {
  const { groupId } = await params;
  const { invite, modal, next, week } = await searchParams;
  const requestHeaders = await headers();
  const origin = getRequestOrigin(requestHeaders);
  const selectedWeek = week ?? getCurrentWeekStart();
  const homeData = await getHomeData(groupId, selectedWeek, { includeActivePosts: true });
  const activeGroup = homeData.groups.find((item) => item.id === groupId) ?? null;
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
  const currentPath = activeGroup ? `/groups/${activeGroup.id}?week=${selectedWeek}` : "/";
  const loginNextPath = getSafeRedirectPath(next, currentPath);
  const inviteUrl = activeGroup
    ? `${origin}/?modal=join-group&invite=${encodeURIComponent(activeGroup.invite_code)}`
    : null;

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

          {activeGroup ? (
            <GroupWorkspace
              currentUserId={homeData.user?.id ?? null}
              group={activeGroup}
              posts={homeData.posts}
              rescheduleOverview={rescheduleOverview}
              selectedWeek={selectedWeek}
            />
          ) : (
            <section className="rounded-lg border border-neutral-200 bg-white p-6">
              <h1 className="text-xl font-semibold">그룹을 찾지 못했습니다</h1>
              <p className="mt-2 text-sm text-neutral-600">
                참여 중인 그룹이 아니거나 삭제된 그룹입니다.
              </p>
            </section>
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
