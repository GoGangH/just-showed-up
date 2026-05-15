"use client";

import { useOptimistic, useState, useTransition } from "react";

export const reactions = [
  { type: "helpful", label: "도움됨" },
  { type: "relate", label: "공감" },
  { type: "cheer", label: "응원" },
  { type: "curious", label: "궁금함" },
  { type: "join", label: "같이 할래" },
] as const;

export function getReactionLabel(type: string) {
  return reactions.find((reaction) => reaction.type === type)?.label ?? type;
}

export function ReactionBar({
  initialCounts,
  postId,
}: {
  initialCounts: Record<string, number>;
  postId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState(initialCounts);
  const [optimisticCounts, addOptimisticReaction] = useOptimistic(
    counts,
    (current, reactionType: string) => ({
      ...current,
      [reactionType]: (current[reactionType] ?? 0) + 1,
    }),
  );
  const [pending, startTransition] = useTransition();

  function submitReaction(reactionType: string) {
    setError(null);
    startTransition(async () => {
      addOptimisticReaction(reactionType);

      const response = await fetch(`/api/posts/${postId}/reactions`, {
        body: JSON.stringify({ reactionType }),
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as {
        counts?: Record<string, number>;
        error?: string;
        loginHref?: string;
      } | null;

      if (response.status === 401 && data?.loginHref) {
        window.location.href = data.loginHref;
        return;
      }

      if (!response.ok || !data?.counts) {
        setError(data?.error ?? "반응을 저장하지 못했습니다.");
        return;
      }

      setCounts(data.counts);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-sm text-neutral-600">
        {reactions.map((reaction) => {
          const count = optimisticCounts[reaction.type] ?? 0;

          return (
            <span className="rounded-md bg-neutral-100 px-2 py-1" key={reaction.type}>
              {reaction.label} {count}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {reactions.map((reaction) => (
          <button
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            key={reaction.type}
            onClick={() => submitReaction(reaction.type)}
            type="button"
          >
            {pending ? "저장 중" : reaction.label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
