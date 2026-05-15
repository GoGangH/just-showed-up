import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { openAppModal } from "@/components/ModalTrigger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProfileMenuProps = {
  avatarUrl: string | null;
  displayName: string;
};

export function ProfileMenu({ avatarUrl, displayName }: ProfileMenuProps) {
  const initial = displayName.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex cursor-pointer list-none items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1.5 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
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
        <ChevronDown className="text-neutral-500 transition group-data-[state=open]:rotate-180" size={16} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => openAppModal("profile")}>
          <UserRound size={16} />
          내 정보
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/logout">
            <LogOut size={16} />
            로그아웃
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
