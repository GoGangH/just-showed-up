"use client";

import { useActionState, useState } from "react";
import {
  deletePostAttachmentAction,
  updateWeeklyPostAction,
  type PostFormState,
} from "../../actions";

const initialState: PostFormState = {};

type PostEditFormProps = {
  post: {
    attachments: {
      file_name: string;
      file_size: number;
      file_type: string;
      id: string;
    }[];
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
  const formatFileSize = (value: number) => {
    if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)}MB`;
    return `${Math.max(1, Math.round(value / 1024))}KB`;
  };

  return (
    <>
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

      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
        <label className="block">
          <span className="font-medium text-neutral-700">파일 추가 첨부</span>
          <input
            accept="image/*,application/pdf"
            className="mt-2 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            multiple
            name="attachments"
            type="file"
          />
        </label>
        <p className="mt-2 text-xs text-neutral-500">
          기존 파일은 유지되고 새 파일만 추가됩니다. 이미지와 PDF를 최대 5개까지 올릴 수 있습니다.
        </p>
      </div>

      {post.attachments.length > 0 ? (
        <section className="rounded-md border border-neutral-200 p-4">
          <p className="text-sm font-medium text-neutral-700">기존 첨부 파일</p>
          <div className="mt-3 space-y-2">
            {post.attachments.map((attachment) => (
              <div
                className="flex flex-col gap-2 rounded-md bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                key={attachment.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {attachment.file_name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {attachment.file_type === "application/pdf" ? "PDF" : "이미지"} ·{" "}
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
                <button
                  className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  form={`delete-attachment-${attachment.id}`}
                  type="submit"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
      {post.attachments.map((attachment) => (
        <form
          action={deletePostAttachmentAction}
          id={`delete-attachment-${attachment.id}`}
          key={attachment.id}
        >
          <input name="post_id" type="hidden" value={post.id} />
          <input name="attachment_id" type="hidden" value={attachment.id} />
        </form>
      ))}
    </>
  );
}
