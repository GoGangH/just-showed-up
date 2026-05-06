"use client";

import { useActionState, useState } from "react";
import { updateWeeklyPostAction, type PostFormState } from "../../actions";

const initialState: PostFormState = {};

type PostEditFormProps = {
  post: {
    body_markdown: string;
    feedback_question: string | null;
    id: string;
    links: string[];
    title: string;
  };
};

export function PostEditForm({ post }: PostEditFormProps) {
  const [state, formAction, pending] = useActionState(updateWeeklyPostAction, initialState);
  const [links, setLinks] = useState(post.links.length > 0 ? post.links : [""]);

  return (
    <form action={formAction} className="space-y-5">
      <input name="post_id" type="hidden" value={post.id} />

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">제목</span>
        <input
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          defaultValue={post.title}
          name="title"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">본문</span>
        <textarea
          className="mt-1 min-h-72 w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-neutral-900"
          defaultValue={post.body_markdown}
          name="body_markdown"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">피드백 받고 싶은 질문</span>
        <input
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          defaultValue={post.feedback_question ?? ""}
          name="feedback_question"
        />
      </label>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-neutral-700">공유 링크</span>
          <button
            className="text-sm font-semibold text-neutral-600 hover:text-neutral-900"
            onClick={() => setLinks((current) => [...current, ""])}
            type="button"
          >
            링크 추가
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {links.map((link, index) => (
            <input
              className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
              defaultValue={link}
              key={`${link}-${index}`}
              name="links"
              placeholder="https://notion.so/..."
              type="url"
            />
          ))}
        </div>
      </div>

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
          {pending ? "수정 중" : "수정 저장"}
        </button>
      </div>
    </form>
  );
}
