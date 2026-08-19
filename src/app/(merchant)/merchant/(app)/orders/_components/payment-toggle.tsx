"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PAYMENT_STATUS_LABELS } from "@/lib/types/labels";
import type { PaymentStatus } from "@/lib/types/database";

export function PaymentToggle({
  orderId,
  paymentStatus,
  disabled,
}: {
  orderId: string;
  paymentStatus: PaymentStatus;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(paymentStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (disabled) {
      return;
    }
    const next: PaymentStatus = status === "paid" ? "unpaid" : "paid";
    setStatus(next);
    setError(null);
    try {
      const response = await fetch(`/api/merchant/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: next }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(status);
        throw new Error(data.error || "Could not update payment");
      }
      startTransition(() => router.refresh());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update payment");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending || disabled}
        className={`flex h-12 items-center justify-between rounded-2xl px-4 text-sm font-medium disabled:opacity-60 ${
          status === "paid"
            ? "bg-success text-white"
            : "border border-border bg-surface text-muted"
        }`}
      >
        <span>{PAYMENT_STATUS_LABELS[status]}</span>
        <span>{disabled ? "Locked" : status === "paid" ? "Mark unpaid" : "Mark paid"}</span>
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
