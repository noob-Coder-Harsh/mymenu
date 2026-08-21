"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  PRIMARY_STATUS_ACTION,
  isPaidDoneSource,
} from "@/lib/orders/status";
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
  const showPaidDone = isPaidDoneSource(status);
  /** On ready, primary is already Paid & done — don't duplicate. */
  const showPaidDoneSecondary = status === "preparing";

  async function patch(body: {
    order_status?: OrderStatus;
    payment_status?: "paid" | "unpaid";
  }) {
    setError(null);
    const response = await fetch(`/api/merchant/orders/${orderId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Could not update order");
      return;
    }
    startTransition(() => router.refresh());
  }

  if (!primary && !canCancel && !showPaidDone) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {primary ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (status === "ready") {
              void patch({ order_status: "completed", payment_status: "paid" });
              return;
            }
            void patch({ order_status: primary.to });
          }}
          className="flex h-12 items-center justify-center rounded-2xl bg-accent text-base font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Updating…" : primary.label}
        </button>
      ) : null}
      {showPaidDoneSecondary ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            void patch({ order_status: "completed", payment_status: "paid" })
          }
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-base font-medium disabled:opacity-60"
        >
          {pending ? "Updating…" : "Paid & done"}
        </button>
      ) : null}
      {canCancel ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Cancel this order?")) {
              void patch({ order_status: "cancelled" });
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
