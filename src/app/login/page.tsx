import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export default function LoginPage() {
  const configured = hasSupabaseConfig();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6">
        <Link className="text-sm font-semibold text-neutral-500" href="/">
          일단옴
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">쉬었음청년 스터디 시작하기</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          OAuth 계정으로 로그인하고 그룹의 주간 기록과 모임 일정을 관리합니다.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Supabase 연결이 필요합니다.</p>
            <p className="mt-1">
              `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를
              설정하면 로그인 기능을 사용할 수 있습니다.
            </p>
          </div>
        ) : null}

        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
