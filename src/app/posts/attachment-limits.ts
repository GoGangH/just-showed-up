export const attachmentBucket = "post-attachments";
export const imageTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);
export const pdfTypes = new Set(["application/pdf"]);
export const allowedAttachmentTypes = new Set([...imageTypes, ...pdfTypes]);
export const maxAttachmentCount = 5;
export const maxImageSize = 5 * 1024 * 1024;
export const maxPdfSize = 20 * 1024 * 1024;

export function isImageType(type: string) {
  return imageTypes.has(type);
}

export function isPdfType(type: string) {
  return pdfTypes.has(type);
}

export function getMaxSizeForType(type: string) {
  if (isImageType(type)) return maxImageSize;
  if (isPdfType(type)) return maxPdfSize;
  return null;
}

export function formatFileSize(value: number) {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(value / 1024))}KB`;
}

export function getFileExtension(name: string, type: string) {
  const fromName = name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  return (
    {
      "image/gif": "gif",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf",
    }[type] ?? "file"
  );
}
