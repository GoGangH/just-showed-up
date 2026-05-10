"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Mail, MessageCircle, Share2 } from "lucide-react";

type GroupInvitePanelProps = {
  groupName: string;
  inviteCode: string;
  inviteUrl: string;
};

export function GroupInvitePanel({ groupName, inviteCode, inviteUrl }: GroupInvitePanelProps) {
  const [copied, setCopied] = useState<"code" | "message" | null>(null);
  const inviteMessage = useMemo(
    () =>
      `[일단옴] ${groupName}에 초대합니다.\n초대 코드: ${inviteCode}\n참여 링크: ${inviteUrl}`,
    [groupName, inviteCode, inviteUrl],
  );
  const mailHref = `mailto:?subject=${encodeURIComponent(`[일단옴] ${groupName} 초대`)}&body=${encodeURIComponent(inviteMessage)}`;
  const smsHref = `sms:?&body=${encodeURIComponent(inviteMessage)}`;

  async function copy(value: string, type: "code" | "message") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: `[일단옴] ${groupName} 초대`,
        text: inviteMessage,
        url: inviteUrl,
      });
      return;
    }

    await copy(inviteMessage, "message");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm font-semibold text-neutral-500">초대 코드</p>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2">
          <code className="font-mono text-sm font-semibold text-neutral-900">{inviteCode}</code>
          <button
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-700 hover:border-neutral-400"
            onClick={() => copy(inviteCode, "code")}
            type="button"
          >
            {copied === "code" ? <Check size={14} /> : <Copy size={14} />}
            {copied === "code" ? "복사됨" : "복사"}
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-neutral-500">
          초대받은 사람은 로그인 후 이 코드를 입력하면 그룹에 참여할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white"
          onClick={share}
          type="button"
        >
          <Share2 size={16} />
          카카오톡/메신저 공유
        </button>
        <a
          className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
          href={mailHref}
        >
          <Mail size={16} />
          메일로 보내기
        </a>
        <a
          className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
          href={smsHref}
        >
          <MessageCircle size={16} />
          문자/메신저
        </a>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:border-neutral-900"
          onClick={() => copy(inviteMessage, "message")}
          type="button"
        >
          {copied === "message" ? <Check size={16} /> : <Copy size={16} />}
          {copied === "message" ? "초대문 복사됨" : "초대문 복사"}
        </button>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-3 text-sm leading-6 text-neutral-600">
        {inviteMessage.split("\n").map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
