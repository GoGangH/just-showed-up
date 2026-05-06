import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";

type ProfileMenuProps = {
  avatarUrl: string | null;
  displayName: string;
  profileHref: "/" | "/?modal=profile" | `/?group=${string}&modal=profile`;
};

export function ProfileMenu({ avatarUrl, displayName, profileHref }: ProfileMenuProps) {
  const initial = displayName.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1.5 hover:border-neutral-300 [&::-webkit-details-marker]:hidden">
        {avatarUrl ? (
          <img
            alt=""
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
            src={avatarUrl}
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
            {initial}
          </span>
        )}
        <span className="hidden max-w-28 truncate text-sm font-semibold text-neutral-800 sm:inline">
          {displayName}
        </span>
        <ChevronDown className="text-neutral-500 transition group-open:rotate-180" size={16} />
      </summary>

      <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-md border border-neutral-200 bg-white p-1 shadow-lg">
        <Link
          className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          href={profileHref}
        >
          <UserRound size={16} />
          내 정보
        </Link>
        <Link
          className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          href="/logout"
        >
          <LogOut size={16} />
          로그아웃
        </Link>
      </div>
    </details>
  );
}
