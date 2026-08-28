// `![alt](attachment:<id>)` is a placeholder written by PostAttachmentInput when an
// image is inserted into the body. It only becomes a real, renderable URL once resolved
// against a signed/object URL keyed by that id — the server does this with signed URLs
// before rendering the published post; the editor preview needs the same resolution
// against local blob/signed URLs, otherwise rehype-sanitize strips the non-http(s) src.
const attachmentTokenPattern = /attachment:([0-9a-f-]{36})/gi;

export function resolveAttachmentMarkdown(content: string, urlById: Record<string, string>) {
  return content.replace(attachmentTokenPattern, (match, id: string) => urlById[id] ?? match);
}
