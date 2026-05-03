import { Home, LogIn, LogOut, Plus, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";

type SidebarUser = {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
} | null;

export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-neutral-200 bg-white p-5 lg:flex lg:flex-col">
      <div>
        <p className="text-2xl font-bold">일단옴</p>
        <p className="mt-1 text-sm text-neutral-500">주간 스터디 운영 공간</p>
      </div>
      <nav className="mt-8 space-y-2">
        <Link className="flex items-center gap-3 rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white" href="/">
          <Home size={17} /> 홈
        </Link>
        <Link className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100" href="/">
          <UsersRound size={17} /> 쉬었음청년 스터디
        </Link>
        <Link className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100" href="/groups/new">
          <Plus size={17} /> 그룹 만들기
        </Link>
        <Link className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100" href="/groups/join">
          <LogIn size={17} /> 초대 코드 참여
        </Link>
      </nav>

      <div className="mt-auto border-t border-neutral-200 pt-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="size-9 rounded-full object-cover"
                  src={user.avatarUrl}
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-neutral-900 text-white">
                  <UserRound size={17} />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name ?? "로그인됨"}</p>
                <p className="truncate text-xs text-neutral-500">{user.email ?? "이메일 없음"}</p>
              </div>
            </div>
            <Link
              className="flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
              href="/logout"
            >
              <LogOut size={16} /> 로그아웃
            </Link>
          </div>
        ) : (
          <Link
            className="flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white"
            href="/login"
          >
            <LogIn size={16} /> 로그인
          </Link>
        )}
      </div>
    </aside>
  );
}
