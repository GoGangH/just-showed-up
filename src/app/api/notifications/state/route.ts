import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ signature: "not-configured" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ signature: "signed-out" });
  }

  const { data } = await supabase
    .from("notifications")
    .select("id,read_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latest = data as { id: string; read_at: string | null; created_at: string } | null;

  return NextResponse.json(
    {
      signature: latest
        ? `${latest.id}:${latest.created_at}:${latest.read_at ?? "unread"}`
        : "empty",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
