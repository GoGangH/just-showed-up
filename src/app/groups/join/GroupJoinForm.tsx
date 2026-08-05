"use client";

import { useActionState } from "react";
import { joinGroupAction, type GroupFormState } from "../actions";

const initialState: GroupFormState = {};

export function GroupJoinForm({ defaultInviteCode = "" }: { defaultInviteCode?: string }) {
  const [state, formAction, pending] = useActionState(joinGroupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-ink">초대 코드</span>
        <input
          className="mt-1 w-full rounded-md border border-line-strong bg-surface px-4 py-3 font-mono outline-none focus:border-ink"
          defaultValue={defaultInviteCode}
          name="invite_code"
          placeholder="초대 코드를 입력하세요"
        />
      </label>

      {state.error ? (
        <p className="rounded-md border border-berry-border bg-berry-tint px-3 py-2 text-sm text-berry">
          {state.error}
        </p>
      ) : null}

      <button
        className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-inverse disabled:cursor-not-allowed disabled:bg-disabled"
        disabled={pending}
        type="submit"
      >
        {pending ? "참여 중" : "그룹 참여"}
      </button>
    </form>
  );
}
