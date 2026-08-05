"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PostAttachmentInput } from "@/app/posts/PostAttachmentInput";
import { PostBodyEditor } from "@/app/posts/PostBodyEditor";
import {
  clearPostDraft,
  formatDraftSavedAt,
  readPostDraft,
  writePostDraft,
  type StoredPostDraft,
} from "@/app/posts/post-draft";
import { createWeeklyPostAction, type PostFormState } from "../actions";

const initialState: PostFormState = {};
const draftSaveDelayMs = 600;

type PostCreateFormProps = {
  groupId: string;
  weekStart: string;
};

export function PostCreateForm({ groupId, weekStart }: PostCreateFormProps) {
  const [state, formAction, pending] = useActionState(createWeeklyPostAction, initialState);
  const [links, setLinks] = useState([""]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [savedDraft, setSavedDraft] = useState<StoredPostDraft | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLinkRestoreRef = useRef<string[] | null>(null);

  const draftId = `create:${groupId}:${weekStart}`;

  useEffect(() => {
    setSavedDraft(readPostDraft(draftId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  useEffect(() => {
    if (!pendingLinkRestoreRef.current || !formRef.current) return;

    const values = pendingLinkRestoreRef.current;
    pendingLinkRestoreRef.current = null;
    const inputs = formRef.current.querySelectorAll<HTMLInputElement>('input[name="links"]');
    inputs.forEach((input, index) => {
      input.value = values[index] ?? "";
    });
  }, [links]);

  const scheduleDraftSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (!formRef.current) return;
      const formData = new FormData(formRef.current);
      writePostDraft(draftId, {
        title: String(formData.get("title") ?? ""),
        body_markdown: String(formData.get("body_markdown") ?? ""),
        feedback_question: String(formData.get("feedback_question") ?? ""),
        links: formData.getAll("links").map((value) => String(value)),
      });
    }, draftSaveDelayMs);
  };

  const restoreDraft = () => {
    if (!savedDraft || !formRef.current) return;

    const titleInput = formRef.current.elements.namedItem("title") as HTMLInputElement | null;
    if (titleInput) titleInput.value = savedDraft.title;

    const feedbackInput = formRef.current.elements.namedItem(
      "feedback_question",
    ) as HTMLInputElement | null;
    if (feedbackInput) feedbackInput.value = savedDraft.feedback_question;

    if (textareaRef.current) {
      textareaRef.current.value = savedDraft.body_markdown;
      textareaRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const nextLinks = savedDraft.links.length > 0 ? savedDraft.links : [""];
    pendingLinkRestoreRef.current = nextLinks;
    setLinks(nextLinks);

    setSavedDraft(null);
  };

  const dismissDraft = () => {
    clearPostDraft(draftId);
    setSavedDraft(null);
  };

  return (
    <form action={formAction} className="space-y-5" onInput={scheduleDraftSave} ref={formRef}>
      <input name="group_id" type="hidden" value={groupId} />
      <input name="week_start" type="hidden" value={weekStart} />

      {savedDraft ? (
        <div className="flex flex-col gap-2 rounded-md border border-sun-border bg-sun-tint p-3 text-sm text-sun sm:flex-row sm:items-center sm:justify-between">
          <p>{formatDraftSavedAt(savedDraft.savedAt)}에 임시 저장된 내용이 있습니다.</p>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-sun-border bg-surface px-3 py-1.5 text-xs font-semibold text-sun hover:border-sun-border"
              onClick={restoreDraft}
              type="button"
            >
              불러오기
            </button>
            <button
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-sun hover:text-sun"
              onClick={dismissDraft}
              type="button"
            >
              무시
            </button>
          </div>
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-ink">제목</span>
        <input
          className="mt-1 w-full rounded-md border border-line-strong bg-surface px-4 py-3 outline-none focus:border-ink"
          name="title"
          placeholder="예: Next.js 인증 흐름 정리"
        />
      </label>

      <PostBodyEditor textareaRef={textareaRef} />

      <label className="block">
        <span className="text-sm font-medium text-ink">피드백 받고 싶은 질문</span>
        <input
          className="mt-1 w-full rounded-md border border-line-strong bg-surface px-4 py-3 outline-none focus:border-ink"
          name="feedback_question"
          placeholder="예: 이 구조로 계속 진행해도 괜찮을까요?"
        />
      </label>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink">공유 링크</span>
          <button
            className="text-sm font-semibold text-muted hover:text-ink"
            onClick={() => setLinks((current) => [...current, ""])}
            type="button"
          >
            링크 추가
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {links.map((_, index) => (
            <input
              className="w-full rounded-md border border-line-strong bg-surface px-4 py-3 outline-none focus:border-ink"
              key={index}
              name="links"
              placeholder="https://notion.so/..."
              type="url"
            />
          ))}
        </div>
      </div>

      <PostAttachmentInput
        groupId={groupId}
        onUploadingChange={setIsUploadingAttachment}
        textareaRef={textareaRef}
      />

      {state.error ? (
        <p className="rounded-md border border-berry-border bg-berry-tint px-3 py-2 text-sm text-berry">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-inverse disabled:cursor-not-allowed disabled:bg-disabled"
          disabled={pending || isUploadingAttachment}
          type="submit"
        >
          {pending ? "저장 중" : isUploadingAttachment ? "파일 업로드 중" : "공유글 저장"}
        </button>
      </div>
    </form>
  );
}
