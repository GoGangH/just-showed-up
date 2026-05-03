import Link from "next/link";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { GroupCreateForm } from "./GroupCreateForm";

export default function NewGroupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-2xl rounded-lg border border-neutral-200 bg-white p-6">
        <Link className="text-sm font-semibold text-neutral-500" href="/">
          일단옴
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">그룹 만들기</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          기본 모임 시간과 장소를 설정해두면 매주 같은 기준으로 스터디를 운영할 수 있습니다.
        </p>

        {!hasSupabaseConfig() ? (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Supabase 환경변수를 설정하면 그룹 생성 기능을 사용할 수 있습니다.
          </div>
        ) : null}

        <div className="mt-6">
          <GroupCreateForm />
        </div>
      </section>
    </main>
  );
}
