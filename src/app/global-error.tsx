"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="ko">
      <body>
        <main className="min-h-screen px-4 py-8">
          <section className="mx-auto max-w-3xl rounded-lg border border-line bg-surface p-6 text-center">
            <h1 className="text-xl font-semibold">문제가 발생했습니다</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
            <button
              className="mt-6 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-inverse"
              onClick={reset}
              type="button"
            >
              다시 시도
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
