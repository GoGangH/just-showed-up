import { createAnonymousReactionAction } from "../actions";

export const reactions = [
  { type: "helpful", label: "도움됨" },
  { type: "relate", label: "공감" },
  { type: "cheer", label: "응원" },
  { type: "curious", label: "궁금함" },
  { type: "join", label: "같이 할래" },
] as const;

export function getReactionLabel(type: string) {
  return reactions.find((reaction) => reaction.type === type)?.label ?? type;
}

export function ReactionBar({ postId }: { postId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {reactions.map((reaction) => (
        <form action={createAnonymousReactionAction} key={reaction.type}>
          <input name="post_id" type="hidden" value={postId} />
          <input name="reaction_type" type="hidden" value={reaction.type} />
          <button className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-900">
            {reaction.label}
          </button>
        </form>
      ))}
    </div>
  );
}
