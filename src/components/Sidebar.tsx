import { Home, LogIn, Plus, UsersRound } from "lucide-react";
import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-neutral-200 bg-white p-5 lg:block">
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
    </aside>
  );
}
