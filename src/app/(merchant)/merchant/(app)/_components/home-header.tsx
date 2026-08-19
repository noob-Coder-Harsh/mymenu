"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { IconBell, IconUser } from "./icons";

export function HomeHeader({
  storeName,
  isOpen,
  pendingCount,
}: {
  storeName: string;
  isOpen: boolean;
  pendingCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(isOpen);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function toggleStore() {
    const next = !open;
    setOpen(next);
    setError(null);
    try {
      const response = await fetch("/api/merchant/stores", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_open: next }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setOpen(!next);
        throw new Error(data.error || "Could not update store");
      }
      startTransition(() => router.refresh());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update store");
    }
  }

  async function enableAlerts() {
    if (typeof Notification === "undefined") {
      return;
    }
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  return (
    <header className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {storeName}
          </h1>
          <button
            type="button"
            onClick={() => void toggleStore()}
            disabled={pending}
            className={`mt-0.5 text-xs font-semibold ${
              open ? "text-success" : "text-danger"
            }`}
          >
            {pending ? "Saving…" : open ? "Open · tap to close" : "Closed · tap to open"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => void enableAlerts()}
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface"
          aria-label="Order alerts"
        >
          <IconBell className="h-[18px] w-[18px]" />
          {pendingCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          ) : null}
        </button>
        <Link
          href="/merchant/account"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface"
          aria-label="Account"
        >
          <IconUser className="h-[18px] w-[18px]" />
        </Link>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </header>
  );
}
