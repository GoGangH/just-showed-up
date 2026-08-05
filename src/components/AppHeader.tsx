import { ModalTrigger } from "@/components/ModalTrigger";
import { NotificationCacheRefresh } from "@/components/NotificationCacheRefresh";
import { NotificationBell } from "@/components/NotificationBell";
import { PrefetchRouteLink } from "@/components/PrefetchRouteLink";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RestingPersonIcon } from "@/components/icons/RestingPersonIcon";
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
    <header className="sticky top-0 z-10 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
      {isSignedIn ? <NotificationCacheRefresh initialSignature={notificationSignature} /> : null}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <PrefetchRouteLink href="/" prefetchOnMount>
          <div className="flex items-center gap-2.5">
            <RestingPersonIcon className="text-accent" size={26} />
            <div>
              <p className="text-xl font-bold text-ink">일단옴</p>
              <p className="text-xs text-faint">쉬었음청년 스터디</p>
            </div>
          </div>
        </PrefetchRouteLink>
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              <ModalTrigger
                className="hidden rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-line-strong sm:inline-flex"
                modal="new-group"
              >
                그룹 만들기
              </ModalTrigger>
              <ModalTrigger
                className="hidden rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-line-strong sm:inline-flex"
                modal="join-group"
              >
                초대 참여
              </ModalTrigger>
              <NotificationBell notifications={notifications} unreadCount={unreadCount} />
              <ThemeToggle />
              <ProfileMenu avatarUrl={avatarUrl ?? null} displayName={displayName} />
            </>
          ) : (
            <>
              <ModalTrigger
                className="hidden items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-line-strong sm:inline-flex"
                modal="new-group"
              >
                <Plus size={16} />
                그룹 만들기
              </ModalTrigger>
              <ThemeToggle />
              <ModalTrigger
                className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-inverse"
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
