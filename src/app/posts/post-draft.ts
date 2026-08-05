export type PostDraftValues = {
  title: string;
  body_markdown: string;
  feedback_question: string;
  links: string[];
};

export type StoredPostDraft = PostDraftValues & { savedAt: number };

const draftTtlMs = 14 * 24 * 60 * 60 * 1000;

function getDraftKey(id: string) {
  return `post-draft:${id}`;
}

function isEmptyDraft(values: PostDraftValues) {
  return (
    !values.title.trim() &&
    !values.body_markdown.trim() &&
    !values.feedback_question.trim() &&
    values.links.every((link) => !link.trim())
  );
}

export function readPostDraft(id: string): StoredPostDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getDraftKey(id));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredPostDraft;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > draftTtlMs) {
      window.localStorage.removeItem(getDraftKey(id));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writePostDraft(id: string, values: PostDraftValues) {
  if (typeof window === "undefined") return;

  try {
    if (isEmptyDraft(values)) {
      window.localStorage.removeItem(getDraftKey(id));
      return;
    }

    const payload: StoredPostDraft = { ...values, savedAt: Date.now() };
    window.localStorage.setItem(getDraftKey(id), JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (private mode, quota) — autosave is best-effort only.
  }
}

export function clearPostDraft(id: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getDraftKey(id));
  } catch {
    // ignore
  }
}

export function formatDraftSavedAt(savedAt: number) {
  const date = new Date(savedAt);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hours}:${minutes}`;
}
