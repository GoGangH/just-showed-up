"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export type AuthFormState = {
  error?: string;
};

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  return { email, password };
}

export async function signInAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const credentials = readCredentials(formData);
  if ("error" in credentials) {
    return { error: credentials.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return { error: "로그인 정보를 확인해주세요." };
  }

  redirect("/");
}

export async function signUpAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase 환경변수를 먼저 설정해주세요." };
  }

  const credentials = readCredentials(formData);
  if ("error" in credentials) {
    return { error: credentials.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(credentials);

  if (error) {
    return { error: "회원가입을 완료하지 못했습니다. 입력값을 확인해주세요." };
  }

  redirect("/");
}
