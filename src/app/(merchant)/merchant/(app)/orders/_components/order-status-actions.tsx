"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PRIMARY_STATUS_ACTION } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types/database";

export function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const primary = PRIMARY_STATUS_ACTION[status];
  const canCancel = status === "pending" || status === "accepted";

  async function updateStatus(next: OrderStatus) {
    setError(null);
    const response = await fetch(`/api/merchant/orders/${orderId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_status: next }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Could not update order");
      return;
    }
    startTransition(() => router.refresh());
  }

  if (!primary && !canCancel) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {primary ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => void updateStatus(primary.to)}
          className="flex h-12 items-center justify-center rounded-2xl bg-accent text-base font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Updating…" : primary.label}
        </button>
      ) : null}
      {canCancel ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Cancel this order?")) {
              void updateStatus("cancelled");
            }
          }}
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium text-danger disabled:opacity-60"
        >
          Cancel order
        </button>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
