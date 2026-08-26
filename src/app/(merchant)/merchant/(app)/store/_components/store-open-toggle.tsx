"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StoreOpenToggle({ isOpen }: { isOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(isOpen);
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const busy = saving || pending;

  async function toggle() {
    if (busy) {
      return;
    }
    const next = !open;
    setOpen(next);
    setError(null);
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
          open ? "bg-success text-white" : "bg-background text-muted"
        }`}
      >
        {busy ? "Saving…" : open ? "Open" : "Closed"}
      </button>
      {error ? <p className="max-w-40 text-right text-[11px] text-danger">{error}</p> : null}
    </div>
  );
}
