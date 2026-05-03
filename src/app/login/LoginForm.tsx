"use client";

import { useActionState, useState } from "react";
import { signInAction, signUpAction, type AuthFormState } from "./actions";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const action = mode === "sign-in" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 rounded-md bg-neutral-100 p-1">
        <button
          className={`rounded px-3 py-2 text-sm font-semibold ${
            mode === "sign-in" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"
          }`}
          onClick={() => setMode("sign-in")}
          type="button"
        >
          로그인
        </button>
        <button
          className={`rounded px-3 py-2 text-sm font-semibold ${
            mode === "sign-up" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"
          }`}
          onClick={() => setMode("sign-up")}
          type="button"
        >
          회원가입
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">이메일</span>
        <input
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          name="email"
          placeholder="you@example.com"
          type="email"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">비밀번호</span>
        <input
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
          name="password"
          placeholder="6자 이상"
          type="password"
        />
      </label>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
        disabled={pending}
        type="submit"
      >
        {pending ? "처리 중" : mode === "sign-in" ? "로그인" : "회원가입"}
      </button>
    </form>
  );
}
