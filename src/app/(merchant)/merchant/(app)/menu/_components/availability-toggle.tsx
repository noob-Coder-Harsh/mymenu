"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AvailabilityToggle({
  itemId,
  isAvailable,
}: {
  itemId: string;
  isAvailable: boolean;
}) {
  const router = useRouter();
  const [available, setAvailable] = useState(isAvailable);
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const busy = saving || pending;

  async function toggle() {
    if (busy) {
      return;
    }
    const next = !available;
    setAvailable(next);
    setSaving(true);
    try {
      const response = await fetch(`/api/merchant/items/${itemId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: next }),
      });
      if (!response.ok) {
        setAvailable(!next);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setAvailable(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void toggle();
      }}
      disabled={busy}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold disabled:opacity-60 ${
        available ? "bg-success text-white" : "bg-background text-muted"
      }`}
      aria-pressed={available}
    >
      {busy ? "Saving…" : available ? "Available" : "Unavailable"}
    </button>
  );
}
