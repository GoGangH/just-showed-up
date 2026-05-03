import Link from "next/link";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { GroupJoinForm } from "./GroupJoinForm";

export default function JoinGroupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6">
        <Link className="text-sm font-semibold text-neutral-500" href="/">
          일단옴
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">초대 코드로 참여</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          그룹 관리자에게 받은 초대 코드를 입력하면 스터디 그룹에 참여할 수 있습니다.
        </p>

        {!hasSupabaseConfig() ? (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Supabase 환경변수를 설정하면 그룹 참여 기능을 사용할 수 있습니다.
          </div>
        ) : null}

        <div className="mt-6">
          <GroupJoinForm />
        </div>
      </section>
    </main>
  );
}
