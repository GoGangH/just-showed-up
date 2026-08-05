"use client";

import { useActionState } from "react";
import { createAnonymousCommentAction, type PostFormState } from "../actions";

const initialState: PostFormState = {};

export function CommentForm({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(createAnonymousCommentAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input name="post_id" type="hidden" value={postId} />
      <label className="block">
        <span className="text-sm font-medium text-ink">익명 댓글</span>
        <textarea
          className="mt-1 min-h-28 w-full resize-y rounded-md border border-line-strong bg-surface px-4 py-3 outline-none focus:border-ink"
          name="body"
          placeholder="작성자에게 남길 피드백이나 질문을 적어주세요."
        />
      </label>
      {state.error ? (
        <p className="rounded-md border border-berry-border bg-berry-tint px-3 py-2 text-sm text-berry">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-inverse disabled:cursor-not-allowed disabled:bg-disabled"
          disabled={pending}
          type="submit"
        >
          {pending ? "저장 중" : "익명 댓글 남기기"}
        </button>
      </div>
    </form>
  );
}
