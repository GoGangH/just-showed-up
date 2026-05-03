import { NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/link-preview/metadata";

export async function POST(request: Request) {
  const { url } = (await request.json()) as { url?: string };

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await fetchLinkPreview(url));
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
}
