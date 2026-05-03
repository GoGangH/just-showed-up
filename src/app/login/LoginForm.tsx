"use client";

import { useActionState } from "react";
import { Github } from "lucide-react";
import { oauthSignInAction, type AuthFormState } from "./actions";

const initialState: AuthFormState = {};

const providers = [
  {
    id: "kakao",
    label: "카카오로 계속하기",
    icon: "K",
  },
  {
    id: "google",
    label: "Google로 계속하기",
    icon: "G",
  },
  {
    id: "github",
    label: "GitHub로 계속하기",
    icon: null,
  },
];

export function LoginForm() {
  const [state, formAction, pending] = useActionState(oauthSignInAction, initialState);

  return (
    <form action={formAction} className="space-y-2.5">
      {providers.map((provider) => (
        <button
          className="flex w-full items-center justify-center gap-3 rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-800 hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          key={provider.id}
          name="provider"
          type="submit"
          value={provider.id}
        >
          {provider.icon ? (
            <span className="flex size-5 items-center justify-center rounded-full border border-neutral-300 text-xs">
              {provider.icon}
            </span>
          ) : (
            <Github size={18} />
          )}
          {provider.label}
        </button>
      ))}

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <p className="text-xs leading-5 text-neutral-500">
        선택한 OAuth provider가 Supabase에서 활성화되어 있어야 로그인할 수 있습니다.
      </p>
    </form>
  );
}
