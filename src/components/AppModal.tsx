"use client";

import { useCallback, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AppModalProps = {
  title: string;
  closeHref?: string;
  description?: string;
  onClose?: () => void;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

export function AppModal({
  title,
  closeHref = "/",
  description,
  onClose,
  size = "md",
  children,
}: AppModalProps) {
  const widthClass = {
    sm: "max-w-[360px]",
    md: "max-w-xl",
    lg: "max-w-3xl",
  }[size];

  const close = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }

    if (closeHref.startsWith("/") && !closeHref.startsWith("//")) {
      window.history.pushState(null, "", closeHref);
      return;
    }

    window.location.assign(closeHref);
  }, [closeHref, onClose]);

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className={widthClass}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="mt-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
