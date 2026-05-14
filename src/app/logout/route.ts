import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export async function GET(request: Request) {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("supabase"))
    .forEach((cookie) => {
      cookieStore.delete(cookie.name);
    });

  return NextResponse.redirect(new URL("/", request.url));
}
