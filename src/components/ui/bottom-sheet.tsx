"use client";

import { useEffect, type ReactNode } from "react";

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  size = "default",
  padForNav = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "default" | "form";
  /** Extra bottom padding for merchant bottom nav. */
  padForNav?: boolean;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const maxHeight =
    size === "form" ? "max-h-[min(92vh,48rem)]" : "max-h-[min(88vh,40rem)]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 flex w-full max-w-lg flex-col rounded-t-3xl border border-border bg-surface shadow-xl md:rounded-3xl ${maxHeight}`}
      >
        <div className="relative flex shrink-0 items-center border-b border-border px-4 pb-3 pt-3">
          <div
            className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-border md:hidden"
            aria-hidden
          />
          <h2 className="min-w-0 flex-1 truncate pr-3 pt-2 text-base font-bold tracking-tight md:pt-0">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 pt-2 text-sm font-semibold text-muted md:pt-0"
          >
            Close
          </button>
        </div>
        <div
          className={`overflow-y-auto overscroll-contain px-4 pt-4 ${
            padForNav
              ? "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6"
              : "pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
