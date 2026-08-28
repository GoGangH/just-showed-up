// Feed/list views show a plain-text preview of the post body. Image markdown
// (`![alt](attachment:<id>)` or a resolved signed URL) and link markdown carry a URL
// that has no business showing up as text, so both are stripped down to just their
// readable label before the excerpt is flattened to one line.
export function getPostExcerpt(markdown: string, maxLength: number) {
  const flattened = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`-]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  if (flattened.length <= maxLength) return flattened;
  return `${flattened.slice(0, maxLength).trimEnd()}...`;
}
