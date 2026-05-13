"use client";

import { useEffect, useState, type RefObject } from "react";

type ExistingAttachment = {
  file_name: string;
  file_size: number;
  file_type: string;
  id: string;
};

type SelectedAttachment = {
  file_name: string;
  file_type: string;
  previewUrl: string | null;
  token: string;
};

function insertAtCursor(textarea: HTMLTextAreaElement, text: string) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const needsLeadingBreak = before.length > 0 && !before.endsWith("\n");
  const needsTrailingBreak = after.length > 0 && !after.startsWith("\n");
  const insertion = `${needsLeadingBreak ? "\n\n" : ""}${text}${needsTrailingBreak ? "\n\n" : ""}`;

  textarea.value = `${before}${insertion}${after}`;
  textarea.focus();
  const nextPosition = before.length + insertion.length;
  textarea.setSelectionRange(nextPosition, nextPosition);
}

function getMarkdownImage(name: string, token: string) {
  const alt = name.replace(/[[\]]/g, "");
  return `![${alt}](attachment:${token})`;
}

function isImage(type: string) {
  return type.startsWith("image/");
}

function formatFileSize(value: number) {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(value / 1024))}KB`;
}

export function PostAttachmentInput({
  existingAttachments = [],
  textareaRef,
}: {
  existingAttachments?: ExistingAttachment[];
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [selectedAttachments, setSelectedAttachments] = useState<SelectedAttachment[]>([]);
  const existingImages = existingAttachments.filter((attachment) => isImage(attachment.file_type));

  useEffect(() => {
    return () => {
      selectedAttachments.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, [selectedAttachments]);

  const insertImage = (name: string, token: string) => {
    if (!textareaRef.current) return;
    insertAtCursor(textareaRef.current, getMarkdownImage(name, token));
  };

  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
      <label className="block">
        <span className="font-medium text-neutral-700">파일 첨부</span>
        <input
          accept="image/*,application/pdf"
          className="mt-2 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          multiple
          name="attachments"
          onChange={(event) => {
            selectedAttachments.forEach((attachment) => {
              if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
            });

            const files = Array.from(event.currentTarget.files ?? []);
            setSelectedAttachments(
              files.map((file) => ({
                file_name: file.name,
                file_type: file.type,
                previewUrl: isImage(file.type) ? URL.createObjectURL(file) : null,
                token: crypto.randomUUID(),
              })),
            );
          }}
          type="file"
        />
      </label>

      {selectedAttachments.map((attachment) => (
        <input
          key={attachment.token}
          name="attachment_tokens"
          type="hidden"
          value={attachment.token}
        />
      ))}

      <p className="mt-2 text-xs text-neutral-500">
        이미지는 본문 안에 삽입할 수 있고, PDF는 글 하단 파일 목록에 표시됩니다.
      </p>

      {selectedAttachments.length > 0 ? (
        <div className="mt-4 space-y-3">
          {selectedAttachments.map((attachment) => (
            <div
              className="rounded-md border border-neutral-200 bg-white p-3"
              key={attachment.token}
            >
              {attachment.previewUrl ? (
                <img
                  alt=""
                  className="mb-3 max-h-48 w-full rounded-md object-cover"
                  src={attachment.previewUrl}
                />
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {attachment.file_name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {isImage(attachment.file_type) ? "이미지" : "PDF"}
                  </p>
                </div>
                {isImage(attachment.file_type) ? (
                  <button
                    className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
                    onClick={() => insertImage(attachment.file_name, attachment.token)}
                    type="button"
                  >
                    본문에 삽입
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {existingImages.length > 0 ? (
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <p className="text-sm font-medium text-neutral-700">본문에 넣을 기존 이미지</p>
          <div className="mt-3 space-y-2">
            {existingImages.map((attachment) => (
              <div
                className="flex flex-col gap-2 rounded-md bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                key={attachment.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {attachment.file_name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    이미지 · {formatFileSize(attachment.file_size)}
                  </p>
                </div>
                <button
                  className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
                  onClick={() => insertImage(attachment.file_name, attachment.id)}
                  type="button"
                >
                  본문에 삽입
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
