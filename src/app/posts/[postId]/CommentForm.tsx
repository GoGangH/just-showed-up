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
        <span className="text-sm font-medium text-neutral-700">익명 댓글</span>
        <textarea
          className="mt-1 min-h-28 w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          name="body"
          placeholder="작성자에게 남길 피드백이나 질문을 적어주세요."
        />
      </label>
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
          disabled={pending}
          type="submit"
        >
          {pending ? "저장 중" : "익명 댓글 남기기"}
        </button>
      </div>
    </form>
  );
}
