"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { getRequestOrigin } from "@/lib/site-url";

export type AuthFormState = {
  error?: string;
};

const oauthProviders = ["kakao", "google", "github"] as const satisfies readonly Provider[];

export async function oauthSignInAction(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const provider = String(formData.get("provider") ?? "");
  if (!oauthProviders.includes(provider as (typeof oauthProviders)[number])) {
    return { error: "지원하지 않는 로그인 방식입니다." };
  }

  const headersList = await headers();
  const origin = getRequestOrigin(headersList);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: "OAuth 로그인 URL을 만들지 못했습니다. Supabase provider 설정을 확인해주세요." };
  }

  redirect(data.url as never);
}
