import { Home, Plus, Settings, UsersRound } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-line bg-white/70 p-5 lg:block">
      <div>
        <p className="text-2xl font-black">일단옴</p>
        <p className="mt-1 text-sm text-neutral-600">공부는 몰라도 모임엔 일단 옴</p>
      </div>
      <nav className="mt-8 space-y-2">
        <a className="flex items-center gap-3 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" href="#">
          <Home size={17} /> 홈
        </a>
        <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-neutral-700" href="#">
          <UsersRound size={17} /> 쉬었음 스터디
        </a>
        <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-neutral-700" href="#">
          <Plus size={17} /> 그룹 만들기
        </a>
        <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-neutral-700" href="#">
          <Settings size={17} /> 설정
        </a>
      </nav>
    </aside>
  );
}
