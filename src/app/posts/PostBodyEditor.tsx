"use client";

import { useState, type RefObject } from "react";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import { resolveAttachmentMarkdown } from "./resolve-attachment-markdown";

export function PostBodyEditor({
  attachmentUrls = {},
  defaultValue = "",
  textareaRef,
}: {
  attachmentUrls?: Record<string, string>;
  defaultValue?: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [value, setValue] = useState(defaultValue);

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">본문</span>
        <div className="inline-flex rounded-md border border-line bg-line-soft p-1">
          <button
            className={`rounded px-3 py-1.5 text-sm font-semibold ${
              mode === "write" ? "bg-surface text-ink shadow-sm" : "text-faint"
            }`}
            onClick={() => setMode("write")}
            type="button"
          >
            작성
          </button>
          <button
            className={`rounded px-3 py-1.5 text-sm font-semibold ${
              mode === "preview" ? "bg-surface text-ink shadow-sm" : "text-faint"
            }`}
            onClick={() => setMode("preview")}
            type="button"
          >
            미리보기
          </button>
        </div>
      </div>

      <input name="body_markdown" type="hidden" value={value} />
      <textarea
        ref={textareaRef}
        className="mt-1 min-h-72 w-full resize-y rounded-md border border-line-strong bg-surface px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-ink"
        hidden={mode !== "write"}
        onInput={(event) => setValue(event.currentTarget.value)}
        placeholder={"Markdown으로 작성할 수 있습니다.\n\n## 이번 주 진행한 내용\n- \n\n## 어려웠던 점\n- \n\n## 모임에서 이야기하고 싶은 내용\n- "}
        value={value}
      />

      {mode === "preview" ? (
        <div className="mt-1 min-h-72 rounded-md border border-line bg-surface px-4 py-3">
          {value.trim() ? (
            <MarkdownViewer content={resolveAttachmentMarkdown(value, attachmentUrls)} />
          ) : (
            <p className="text-sm text-faint">미리보기할 본문이 없습니다.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
