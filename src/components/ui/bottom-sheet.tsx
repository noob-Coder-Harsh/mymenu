"use client";

import { useEffect, type ReactNode } from "react";

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  footer,
  headerActions,
  size = "default",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Shown left of Close (e.g. Save). */
  headerActions?: ReactNode;
  size?: "default" | "form";
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
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const maxHeight =
    size === "form" ? "max-h-[min(92dvh,48rem)]" : "max-h-[min(88dvh,40rem)]";

  const bodyPad = footer
    ? "pb-4"
    : "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]";

  const footerPad = "pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden md:items-center">
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
        className={`relative z-10 flex w-full max-w-[min(100%,32rem)] flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-xl md:rounded-3xl ${maxHeight}`}
      >
        <div className="relative flex shrink-0 items-center gap-2 border-b border-border px-3 pb-3 pt-3 sm:px-4">
          <div
            className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-border md:hidden"
            aria-hidden
          />
          <h2 className="min-w-0 flex-1 truncate pr-1 pt-2 text-base font-bold tracking-tight md:pt-0">
            {title}
          </h2>
          {headerActions ? (
            <div className="flex shrink-0 items-center gap-2 pt-2 md:pt-0">
              {headerActions}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 pt-2 text-sm font-semibold text-muted md:pt-0"
          >
            Close
          </button>
        </div>
        <div
          className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-4 sm:px-4 ${bodyPad}`}
        >
          {children}
        </div>
        {footer ? (
          <div
            className={`shrink-0 border-t border-border px-3 pt-3 sm:px-4 ${footerPad}`}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
