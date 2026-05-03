import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  const { url } = (await request.json()) as { url?: string };

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return NextResponse.json({ error: "unsupported protocol" }, { status: 400 });
  }

  try {
    const response = await fetch(target, {
      headers: {
        "user-agent": "ildan-om-link-preview/0.1",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("text/html")) {
      return NextResponse.json({
        url: target.toString(),
        title: target.hostname,
        description: null,
        imageUrl: null,
        siteName: target.hostname,
      });
    }

    const html = await response.text();

    return NextResponse.json({
      url: target.toString(),
      title: extractTitle(html),
      description: extractMeta(html, "og:description") ?? extractMeta(html, "description"),
      imageUrl: extractMeta(html, "og:image"),
      siteName: extractMeta(html, "og:site_name") ?? target.hostname,
    });
  } catch {
    return NextResponse.json({
      url: target.toString(),
      title: target.hostname,
      description: null,
      imageUrl: null,
      siteName: target.hostname,
    });
  }
}
