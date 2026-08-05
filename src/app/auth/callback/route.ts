import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { syncProfileFromUser } from "@/lib/profiles";
import { getSafeRedirectPath } from "@/lib/redirects";
import { getConfiguredSiteOrigin } from "@/lib/site-url";

function redirectWithError(requestUrl: URL, message: string) {
  const redirectOrigin = getConfiguredSiteOrigin() ?? requestUrl.origin;
  const target = new URL("/login", redirectOrigin);
  target.searchParams.set("error", message);
  const next = requestUrl.searchParams.get("next");
  if (next) target.searchParams.set("next", next);
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (providerError) {
    console.error("[auth/callback] provider returned an error:", providerError);
    return redirectWithError(requestUrl, providerError);
  }

  if (!code || !hasSupabaseConfig()) {
    console.error("[auth/callback] missing code or Supabase config", {
      hasCode: Boolean(code),
      hasConfig: hasSupabaseConfig(),
    });
    return redirectWithError(requestUrl, "로그인 코드를 확인하지 못했습니다.");
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession failed:", exchangeError.message);
    return redirectWithError(requestUrl, `세션 교환에 실패했습니다: ${exchangeError.message}`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[auth/callback] getUser failed after successful code exchange:", userError?.message);
    return redirectWithError(requestUrl, "로그인 세션을 확인하지 못했습니다.");
  }

  await syncProfileFromUser(supabase, user);

  const redirectOrigin = getConfiguredSiteOrigin() ?? requestUrl.origin;
  return NextResponse.redirect(new URL(getSafeRedirectPath(requestUrl.searchParams.get("next")), redirectOrigin));
}
