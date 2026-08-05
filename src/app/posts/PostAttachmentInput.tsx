"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  attachmentBucket,
  allowedAttachmentTypes,
  formatFileSize,
  getFileExtension,
  getMaxSizeForType,
  isImageType,
  maxAttachmentCount,
} from "./attachment-limits";

type ExistingAttachment = {
  file_name: string;
  file_size: number;
  file_type: string;
  id: string;
  signedUrl?: string | null;
};

type UploadStatus = "uploading" | "done" | "error";

type SelectedAttachment = {
  file: File;
  file_name: string;
  file_type: string;
  file_size: number;
  filePath: string | null;
  previewUrl: string | null;
  errorMessage: string | null;
  status: UploadStatus;
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
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function getMarkdownImage(name: string, token: string) {
  const alt = name.replace(/[[\]]/g, "");
  return `![${alt}](attachment:${token})`;
}

export function PostAttachmentInput({
  existingAttachments = [],
  groupId,
  onUploadingChange,
  textareaRef,
}: {
  existingAttachments?: ExistingAttachment[];
  groupId: string;
  onUploadingChange?: (isUploading: boolean) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [selectedAttachments, setSelectedAttachments] = useState<SelectedAttachment[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const removedTokens = useRef(new Set<string>());
  const existingImages = existingAttachments.filter((attachment) => isImageType(attachment.file_type));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    return () => {
      selectedAttachments.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, [selectedAttachments]);

  useEffect(() => {
    const isUploading = selectedAttachments.some((attachment) => attachment.status === "uploading");
    onUploadingChange?.(isUploading);
  }, [selectedAttachments, onUploadingChange]);

  const insertImage = (name: string, token: string) => {
    if (!textareaRef.current) return;
    insertAtCursor(textareaRef.current, getMarkdownImage(name, token));
  };

  const uploadAttachment = async (attachment: SelectedAttachment) => {
    const supabase = createClient();
    const extension = getFileExtension(attachment.file_name, attachment.file_type);
    const filePath = `${userId}/${groupId}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from(attachmentBucket).upload(filePath, attachment.file, {
      cacheControl: "3600",
      contentType: attachment.file_type,
      upsert: false,
    });

    if (removedTokens.current.has(attachment.token)) {
      if (!error) await supabase.storage.from(attachmentBucket).remove([filePath]);
      removedTokens.current.delete(attachment.token);
      return;
    }

    setSelectedAttachments((current) =>
      current.map((item) =>
        item.token === attachment.token
          ? error
            ? { ...item, status: "error", errorMessage: "업로드에 실패했습니다. 다시 시도해주세요." }
            : { ...item, status: "done", filePath }
          : item,
      ),
    );
  };

  const addFiles = (files: File[]) => {
    setFormError(null);

    const availableSlots =
      maxAttachmentCount - existingAttachments.length - selectedAttachments.length;
    if (availableSlots <= 0) {
      setFormError(`첨부 파일은 최대 ${maxAttachmentCount}개까지 올릴 수 있습니다.`);
      return;
    }

    const accepted: SelectedAttachment[] = [];
    for (const file of files.slice(0, availableSlots)) {
      if (!allowedAttachmentTypes.has(file.type)) {
        setFormError("첨부 파일은 JPG, PNG, WebP, GIF, PDF 형식만 올릴 수 있습니다.");
        continue;
      }

      const maxSize = getMaxSizeForType(file.type);
      if (maxSize && file.size > maxSize) {
        setFormError(
          isImageType(file.type)
            ? "이미지 한 장의 크기는 5MB 이하여야 합니다."
            : "PDF 한 개의 크기는 20MB 이하여야 합니다.",
        );
        continue;
      }

      accepted.push({
        file,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        filePath: null,
        previewUrl: isImageType(file.type) ? URL.createObjectURL(file) : null,
        errorMessage: null,
        status: "uploading",
        token: crypto.randomUUID(),
      });
    }

    if (files.length > availableSlots) {
      setFormError(`첨부 파일은 최대 ${maxAttachmentCount}개까지 올릴 수 있습니다.`);
    }

    if (accepted.length === 0) return;

    setSelectedAttachments((current) => [...current, ...accepted]);
    accepted.forEach((attachment) => uploadAttachment(attachment));
  };

  const removeAttachment = (attachment: SelectedAttachment) => {
    if (attachment.status === "uploading") {
      removedTokens.current.add(attachment.token);
    } else if (attachment.status === "done" && attachment.filePath) {
      const supabase = createClient();
      void supabase.storage.from(attachmentBucket).remove([attachment.filePath]);
    }

    if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setSelectedAttachments((current) => current.filter((item) => item.token !== attachment.token));
  };

  const retryAttachment = (attachment: SelectedAttachment) => {
    setSelectedAttachments((current) =>
      current.map((item) =>
        item.token === attachment.token ? { ...item, status: "uploading", errorMessage: null } : item,
      ),
    );
    uploadAttachment(attachment);
  };

  return (
    <div className="rounded-md border border-line bg-line-soft p-4 text-sm leading-6 text-muted">
      <label className="block">
        <span className="font-medium text-ink">파일 첨부</span>
        <input
          accept="image/*,application/pdf"
          className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-inverse disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!userId}
          multiple
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            if (files.length > 0) addFiles(files);
          }}
          type="file"
        />
      </label>

      {!userId ? <p className="mt-2 text-xs text-faint">사용자 정보를 확인하는 중입니다...</p> : null}

      {selectedAttachments
        .filter((attachment) => attachment.status === "done" && attachment.filePath)
        .map((attachment) => (
          <input
            key={attachment.token}
            name="attachment_uploads"
            type="hidden"
            value={JSON.stringify({
              token: attachment.token,
              file_path: attachment.filePath,
              file_name: attachment.file_name,
              file_type: attachment.file_type,
              file_size: attachment.file_size,
            })}
          />
        ))}

      <p className="mt-2 text-xs text-faint">
        이미지는 본문 안에 삽입할 수 있고, PDF는 글 하단 파일 목록에 표시됩니다. 파일은 선택하면 바로
        업로드됩니다.
      </p>

      {formError ? (
        <p className="mt-2 rounded-md border border-berry-border bg-berry-tint px-3 py-2 text-xs text-berry">
          {formError}
        </p>
      ) : null}

      {selectedAttachments.length > 0 ? (
        <div className="mt-4 space-y-3">
          {selectedAttachments.map((attachment) => (
            <div
              className="rounded-md border border-line bg-surface p-3"
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
                  <p className="truncate text-sm font-semibold text-ink">
                    {attachment.file_name}
                  </p>
                  <p className="mt-1 text-xs text-faint">
                    {isImageType(attachment.file_type) ? "이미지" : "PDF"} ·{" "}
                    {formatFileSize(attachment.file_size)} ·{" "}
                    {attachment.status === "uploading"
                      ? "업로드 중"
                      : attachment.status === "error"
                        ? attachment.errorMessage
                        : "업로드 완료"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {attachment.status === "error" ? (
                    <button
                      className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-ink"
                      onClick={() => retryAttachment(attachment)}
                      type="button"
                    >
                      다시 시도
                    </button>
                  ) : null}
                  {attachment.status === "done" && isImageType(attachment.file_type) ? (
                    <button
                      className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-ink"
                      onClick={() => insertImage(attachment.file_name, attachment.token)}
                      type="button"
                    >
                      본문에 삽입
                    </button>
                  ) : null}
                  <button
                    className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-berry-border hover:text-berry"
                    onClick={() => removeAttachment(attachment)}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {existingImages.length > 0 ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-sm font-medium text-ink">본문에 넣을 기존 이미지</p>
          <div className="mt-3 space-y-2">
            {existingImages.map((attachment) => (
              <div
                className="rounded-md bg-surface p-3"
                key={attachment.id}
              >
                {attachment.signedUrl ? (
                  <img
                    alt=""
                    className="mb-3 max-h-40 w-full rounded-md object-cover"
                    referrerPolicy="no-referrer"
                    src={attachment.signedUrl}
                  />
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {attachment.file_name}
                    </p>
                    <p className="mt-1 text-xs text-faint">
                      이미지 · {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                  <button
                    className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-ink"
                    onClick={() => insertImage(attachment.file_name, attachment.id)}
                    type="button"
                  >
                    본문에 삽입
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
