export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
};

function extractMeta(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function extractTitle(html: string) {
  const ogTitle = extractMeta(html, "og:title");
  if (ogTitle) return ogTitle;

  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return title?.trim() ?? null;
}

export function normalizePreviewUrl(value: string) {
  const target = new URL(value);

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Unsupported protocol");
  }

  return target;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  try {
    const target = normalizePreviewUrl(url);
    const response = await fetch(target, {
      headers: {
        "user-agent": "just-showed-up-link-preview/0.1",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    const fallback = {
      url: target.toString(),
      title: target.hostname,
      description: null,
      imageUrl: null,
      siteName: target.hostname,
    };

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("text/html")) {
      return fallback;
    }

    const html = await response.text();

    return {
      url: target.toString(),
      title: extractTitle(html),
      description: extractMeta(html, "og:description") ?? extractMeta(html, "description"),
      imageUrl: extractMeta(html, "og:image"),
      siteName: extractMeta(html, "og:site_name") ?? target.hostname,
    };
  } catch {
    const fallbackUrl = url.trim();
    return {
      url: fallbackUrl,
      title: fallbackUrl,
      description: null,
      imageUrl: null,
      siteName: null,
    };
  }
}
