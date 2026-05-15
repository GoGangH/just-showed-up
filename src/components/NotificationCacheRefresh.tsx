"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type NotificationCacheRefreshProps = {
  initialSignature: string;
};

export function NotificationCacheRefresh({ initialSignature }: NotificationCacheRefreshProps) {
  const router = useRouter();
  const signatureRef = useRef(initialSignature);

  useEffect(() => {
    let cancelled = false;

    async function checkNotificationState() {
      try {
        const response = await fetch("/api/notifications/state", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = (await response.json()) as { signature?: string };
        const nextSignature = data.signature ?? "";
        if (!nextSignature || nextSignature === signatureRef.current) return;

        signatureRef.current = nextSignature;
        if (!cancelled) router.refresh();
      } catch {
        // Ignore transient network errors. The next poll will retry.
      }
    }

    const interval = window.setInterval(checkNotificationState, 30_000);
    const onFocus = () => {
      void checkNotificationState();
    };

    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}
