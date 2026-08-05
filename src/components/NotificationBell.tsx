"use client";

import { Bell, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
} from "@/app/notifications/actions";
import type { HeaderNotification } from "@/lib/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function NotificationBell({ notifications }: NotificationBellProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [visibleNotifications, setVisibleNotifications] = useState(notifications);
  const [optimisticNotifications, applyOptimistic] = useOptimistic(
    visibleNotifications,
    (
      current,
      action:
        | { type: "delete"; id: string }
        | { type: "read-all" },
    ) =>
      action.type === "delete"
        ? current.filter((notification) => notification.id !== action.id)
        : current.map((notification) => ({ ...notification, read_at: new Date().toISOString() })),
  );
  const optimisticUnreadCount = optimisticNotifications.filter(
    (notification) => !notification.read_at,
  ).length;
  const [pending, startTransition] = useTransition();

  function markAllRead() {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "read-all" });
      const result = await markAllNotificationsReadAction();
      if (result?.error) {
        setError(result.error);
        return;
      }
      setVisibleNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at: notification.read_at ?? new Date().toISOString(),
        })),
      );
      router.refresh();
    });
  }

  function deleteNotification(id: string) {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id });
      const result = await deleteNotificationAction(id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setVisibleNotifications((current) =>
        current.filter((notification) => notification.id !== id),
      );
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`알림 ${optimisticUnreadCount}개`}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-line bg-surface text-ink hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Bell size={18} />
        {optimisticUnreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-xs font-semibold leading-none text-inverse">
            {optimisticUnreadCount > 9 ? "9+" : optimisticUnreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(calc(100vw-2rem),20rem)] p-0">
        <div className="flex items-start justify-between gap-3 border-b border-line-soft px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">알림</p>
            <p className="mt-1 text-xs text-faint">
              최근 알림 {optimisticNotifications.length}개
            </p>
          </div>
          {optimisticUnreadCount > 0 ? (
            <form action={markAllRead}>
              <button
                className="rounded-md border border-line px-2 py-1 text-xs font-semibold text-muted hover:border-line-strong hover:text-ink"
                disabled={pending}
                type="submit"
              >
                모두 읽음
              </button>
            </form>
          ) : null}
        </div>

        {error ? (
          <p className="border-b border-berry-tint bg-berry-tint px-4 py-2 text-xs text-berry">
            {error}
          </p>
        ) : null}

        {optimisticNotifications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-faint">새 알림이 없습니다.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto p-1">
            {optimisticNotifications.map((notification) => (
              <div
                className="group flex items-start gap-1 rounded px-3 py-3 hover:bg-line-soft"
                key={notification.id}
              >
                <Link className="min-w-0 flex-1" href={`/notifications/${notification.id}`}>
                  <div className="flex items-start gap-2">
                    {!notification.read_at ? (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-teal-600" />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-transparent" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {notification.title}
                      </p>
                      {notification.body ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                          {notification.body}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-faint">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
                <button
                  aria-label="알림 삭제"
                  className="mt-0.5 rounded p-1.5 text-faint opacity-100 hover:bg-surface hover:text-berry sm:opacity-0 sm:group-hover:opacity-100"
                  disabled={pending}
                  onClick={() => deleteNotification(notification.id)}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
