"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StoreOpenToggle({ isOpen }: { isOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(isOpen);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
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

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending}
        className={`flex h-12 items-center justify-between rounded-2xl px-4 text-sm font-medium ${
          open
            ? "bg-success text-white"
            : "border border-border bg-surface text-muted"
        }`}
      >
        <span>{open ? "Store is open" : "Store is closed"}</span>
        <span>{pending ? "Saving…" : open ? "Open" : "Closed"}</span>
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
