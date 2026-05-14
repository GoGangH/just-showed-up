import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { syncProfileFromUser } from "@/lib/profiles";
import { getSafeRedirectPath } from "@/lib/redirects";
import { getConfiguredSiteOrigin } from "@/lib/site-url";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code && hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await syncProfileFromUser(supabase, user);
    }
  }

  const redirectOrigin = getConfiguredSiteOrigin() ?? requestUrl.origin;
  return NextResponse.redirect(new URL(getSafeRedirectPath(requestUrl.searchParams.get("next")), redirectOrigin));
}
