"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PostsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-line bg-surface p-6 text-center">
        <h1 className="text-xl font-semibold">문제가 발생했습니다</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          요청을 처리하는 중 오류가 발생했습니다. 작성 중이던 내용은 임시 저장되어 있으니
          안심하고 다시 시도해주세요.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-inverse"
            onClick={reset}
            type="button"
          >
            다시 시도
          </button>
          <Link
            className="rounded-md border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink"
            href="/"
          >
            홈으로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}
