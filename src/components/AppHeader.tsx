import { ModalTrigger } from "@/components/ModalTrigger";
import { NotificationCacheRefresh } from "@/components/NotificationCacheRefresh";
import { NotificationBell } from "@/components/NotificationBell";
import { PrefetchRouteLink } from "@/components/PrefetchRouteLink";
import { ProfileMenu } from "@/components/ProfileMenu";
import type { HeaderNotification } from "@/lib/notifications";
import { Plus } from "lucide-react";

type AppHeaderProps = {
  avatarUrl?: string | null;
  displayName: string;
  isSignedIn: boolean;
  notifications: HeaderNotification[];
  unreadCount: number;
};

export function AppHeader({
  avatarUrl,
  displayName,
  isSignedIn,
  notifications,
  unreadCount,
}: AppHeaderProps) {
  const latestNotification = notifications[0];
  const notificationSignature = latestNotification
    ? `${latestNotification.id}:${latestNotification.created_at}:${latestNotification.read_at ?? "unread"}`
    : "empty";

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
      {isSignedIn ? <NotificationCacheRefresh initialSignature={notificationSignature} /> : null}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <PrefetchRouteLink href="/" prefetchOnMount>
          <div>
            <p className="text-xl font-bold">일단옴</p>
            <p className="text-xs text-neutral-600">쉬었음청년 스터디</p>
          </div>
        </PrefetchRouteLink>
        <div className="flex items-center gap-2">
          {isSignedIn ? (
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
              <NotificationBell notifications={notifications} unreadCount={unreadCount} />
              <ProfileMenu avatarUrl={avatarUrl ?? null} displayName={displayName} />
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
              <ModalTrigger
                className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white"
                modal="login"
              >
                로그인
              </ModalTrigger>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
