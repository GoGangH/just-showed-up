"use client";

import { useActionState } from "react";
import { leaveGroupAction, type GroupFormState } from "@/app/groups/actions";

const initialState: GroupFormState = {};

export function GroupLeaveForm({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [state, formAction, pending] = useActionState(leaveGroupAction, initialState);

  return (
    <form action={formAction} className="rounded-md border border-red-200 bg-red-50 p-3">
      <input name="group_id" type="hidden" value={groupId} />
      <p className="text-sm font-semibold text-red-800">현재 그룹에서 나가기</p>
      <p className="mt-1 text-xs leading-5 text-red-700">
        `{groupName}`에서 나가면 이 그룹의 글과 일정에 접근할 수 없습니다.
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm font-medium text-red-800">
        <input
          className="size-4 rounded border-red-300"
          name="confirm_leave"
          type="checkbox"
          value="yes"
        />
        이 그룹에서 나갑니다
      </label>
      {state.error ? (
        <p className="mt-2 rounded-md border border-red-200 bg-white px-3 py-2 text-xs text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        className="mt-3 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "처리 중" : "그룹 나가기"}
      </button>
    </form>
  );
}
