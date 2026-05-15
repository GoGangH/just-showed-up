"use client";

import type { ReactNode } from "react";

export type AppModalName =
  | "group-settings"
  | "invite"
  | "join-group"
  | "login"
  | "new-group"
  | "profile"
  | "reschedule";

export function openAppModal(modal: AppModalName) {
  window.dispatchEvent(new CustomEvent<AppModalName>("app-modal:open", { detail: modal }));
}

export function ModalTrigger({
  children,
  className,
  modal,
}: {
  children: ReactNode;
  className?: string;
  modal: AppModalName;
}) {
  return (
    <button className={className} onClick={() => openAppModal(modal)} type="button">
      {children}
    </button>
  );
}
