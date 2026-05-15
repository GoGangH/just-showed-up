"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  type ComponentProps,
  type ReactNode,
} from "react";

type NextLinkProps = ComponentProps<typeof Link>;
type PrefetchRouteLinkProps = Omit<NextLinkProps, "href" | "prefetch" | "scroll"> & {
  children?: ReactNode;
  href: string;
  prefetchOnMount?: boolean;
  scroll?: boolean;
};

export function PrefetchRouteLink({
  children,
  href,
  onFocus,
  onMouseEnter,
  onTouchStart,
  prefetchOnMount = false,
  scroll = false,
  ...props
}: PrefetchRouteLinkProps) {
  const router = useRouter();

  const prefetch = useCallback(() => {
    if (!href.startsWith("/") || href.startsWith("//")) return;
    router.prefetch(href as never);
  }, [href, router]);

  useEffect(() => {
    if (!prefetchOnMount) return;

    const idleCallback =
      "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (callback: IdleRequestCallback) => window.setTimeout(callback, 1);
    const cancelIdleCallback =
      "cancelIdleCallback" in window
        ? window.cancelIdleCallback
        : (id: number) => window.clearTimeout(id);

    const id = idleCallback(() => prefetch());
    return () => cancelIdleCallback(id);
  }, [prefetch, prefetchOnMount]);

  return (
    <Link
      {...props}
      href={href as never}
      onFocus={(event) => {
        prefetch();
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        prefetch();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        prefetch();
        onTouchStart?.(event);
      }}
      prefetch
      scroll={scroll}
    >
      {children}
    </Link>
  );
}
