"use client";

import { useActionState } from "react";
import { joinGroupAction, type GroupFormState } from "../actions";

const initialState: GroupFormState = {};

export function GroupJoinForm({ defaultInviteCode = "" }: { defaultInviteCode?: string }) {
  const [state, formAction, pending] = useActionState(joinGroupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">초대 코드</span>
        <input
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 font-mono outline-none focus:border-neutral-900"
          defaultValue={defaultInviteCode}
          name="invite_code"
          placeholder="초대 코드를 입력하세요"
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
        {pending ? "참여 중" : "그룹 참여"}
      </button>
    </form>
  );
}
