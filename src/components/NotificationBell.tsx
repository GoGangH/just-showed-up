import { Bell } from "lucide-react";
import Link from "next/link";
import { markAllNotificationsReadAction } from "@/app/notifications/actions";
import type { HeaderNotification } from "@/lib/notifications";

type NotificationBellProps = {
  notifications: HeaderNotification[];
  unreadCount: number;
};

function formatTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  return (
    <details className="group relative">
      <summary
        aria-label={`알림 ${unreadCount}개`}
        className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 [&::-webkit-details-marker]:hidden"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-center text-xs font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </summary>

      <div className="absolute right-0 top-full z-20 mt-2 w-[min(calc(100vw-2rem),20rem)] overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">알림</p>
            <p className="mt-1 text-xs text-neutral-500">최근 알림 {notifications.length}개</p>
          </div>
          {unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button
                className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                type="submit"
              >
                모두 읽음
              </button>
            </form>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">새 알림이 없습니다.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto p-1">
            {notifications.map((notification) => (
              <Link
                className="block rounded px-3 py-3 hover:bg-neutral-50"
                href={`/notifications/${notification.id}`}
                key={notification.id}
              >
                <div className="flex items-start gap-2">
                  {!notification.read_at ? (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-teal-600" />
                  ) : (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-transparent" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {notification.title}
                    </p>
                    {notification.body ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-600">
                        {notification.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-neutral-400">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
