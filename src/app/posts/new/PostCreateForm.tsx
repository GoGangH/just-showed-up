"use client";

import { useActionState, useState } from "react";
import { createWeeklyPostAction, type PostFormState } from "../actions";

const initialState: PostFormState = {};

type PostCreateFormProps = {
  groupId: string;
  weekStart: string;
};

export function PostCreateForm({ groupId, weekStart }: PostCreateFormProps) {
  const [state, formAction, pending] = useActionState(createWeeklyPostAction, initialState);
  const [links, setLinks] = useState([""]);

  return (
    <form action={formAction} className="space-y-5">
      <input name="group_id" type="hidden" value={groupId} />
      <input name="week_start" type="hidden" value={weekStart} />

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">제목</span>
        <input
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          name="title"
          placeholder="예: Next.js 인증 흐름 정리"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">본문</span>
        <textarea
          className="mt-1 min-h-72 w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-neutral-900"
          name="body_markdown"
          placeholder={"Markdown으로 작성할 수 있습니다.\n\n## 이번 주 진행한 내용\n- \n\n## 어려웠던 점\n- \n\n## 모임에서 이야기하고 싶은 내용\n- "}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">피드백 받고 싶은 질문</span>
        <input
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          name="feedback_question"
          placeholder="예: 이 구조로 계속 진행해도 괜찮을까요?"
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
          {links.map((_, index) => (
            <input
              className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
              key={index}
              name="links"
              placeholder="https://notion.so/..."
              type="url"
            />
          ))}
        </div>
      </div>

      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
        PDF와 이미지 업로드는 다음 단계에서 Supabase Storage 권한 설정과 함께 연결합니다.
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
          {pending ? "저장 중" : "공유글 저장"}
        </button>
      </div>
    </form>
  );
}
