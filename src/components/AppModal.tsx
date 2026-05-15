"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type AppModalProps = {
  title: string;
  closeHref?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

export function AppModal({ title, closeHref = "/", description, size = "md", children }: AppModalProps) {
  const [open, setOpen] = useState(true);
  const widthClass = {
    sm: "max-w-[360px]",
    md: "max-w-xl",
    lg: "max-w-3xl",
  }[size];

  const close = useCallback(() => {
    setOpen(false);

    if (closeHref.startsWith("/") && !closeHref.startsWith("//")) {
      window.history.pushState(null, "", closeHref);
      return;
    }

    window.location.assign(closeHref);
  }, [closeHref]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-4 py-6 sm:items-center">
      <button aria-label="닫기" className="absolute inset-0 cursor-default" onClick={close} type="button" />
      <section className={`relative z-10 max-h-[calc(100vh-48px)] w-full ${widthClass} overflow-y-auto rounded-lg border border-neutral-200 bg-white p-5 shadow-xl`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
            ) : null}
          </div>
          <button className="rounded-md border border-neutral-200 p-2 text-neutral-600 hover:text-neutral-900" onClick={close} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
