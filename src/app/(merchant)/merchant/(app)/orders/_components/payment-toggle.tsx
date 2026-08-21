"use client";

import { useState } from "react";
import { patchMerchantOrderOptimistic } from "@/lib/orders/merchant-order-store";
import { PAYMENT_STATUS_LABELS } from "@/lib/types/labels";
import type { PaymentStatus } from "@/lib/types/database";

export function PaymentToggle({
  orderId,
  paymentStatus,
  disabled,
  methodLabel,
}: {
  orderId: string;
  paymentStatus: PaymentStatus;
  disabled?: boolean;
  methodLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (disabled) {
      return;
    }
    const next: PaymentStatus = paymentStatus === "paid" ? "unpaid" : "paid";
    setError(null);
    void patchMerchantOrderOptimistic(orderId, { payment_status: next }).then(
      (result) => {
        if (!result.ok) {
          setError(result.error);
        }
      },
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => toggle()}
        disabled={disabled}
        className={`flex h-11 items-center justify-between rounded-2xl px-3.5 text-sm font-medium disabled:opacity-60 ${
          paymentStatus === "paid"
            ? "bg-success text-white"
            : "border border-border bg-surface text-muted"
        }`}
      >
        <span>
          {PAYMENT_STATUS_LABELS[paymentStatus]}
          {methodLabel ? ` · ${methodLabel}` : ""}
        </span>
        <span className="text-xs opacity-90">
          {disabled
            ? "Locked"
            : paymentStatus === "paid"
              ? "Mark unpaid"
              : "Mark paid"}
        </span>
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
