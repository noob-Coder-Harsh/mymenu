"use client";

import { useState } from "react";
import { patchMerchantOrderOptimistic } from "@/lib/orders/merchant-order-store";
import {
  PRIMARY_STATUS_ACTION,
  isPaidDoneSource,
} from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types/database";

export function OrderStatusActions({
  orderId,
  status,
  includeCancel = true,
}: {
  orderId: string;
  status: OrderStatus;
  includeCancel?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const primary = PRIMARY_STATUS_ACTION[status];
  const canCancel =
    includeCancel && (status === "pending" || status === "accepted");
  const showPaidDone = isPaidDoneSource(status);
  /** On ready, primary is already Paid & done — don't duplicate. */
  const showPaidDoneSecondary = status === "preparing";

  function patch(body: {
    order_status?: OrderStatus;
    payment_status?: "paid" | "unpaid";
  }) {
    setError(null);
    void patchMerchantOrderOptimistic(orderId, body).then((result) => {
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  if (!primary && !canCancel && !showPaidDone) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {primary ? (
        <button
          type="button"
          onClick={() => {
            if (status === "ready") {
              patch({ order_status: "completed", payment_status: "paid" });
              return;
            }
            patch({ order_status: primary.to });
          }}
          className="flex h-12 items-center justify-center rounded-2xl bg-accent text-base font-semibold text-accent-foreground"
        >
          {primary.label}
        </button>
      ) : null}
      {showPaidDoneSecondary ? (
        <button
          type="button"
          onClick={() =>
            patch({ order_status: "completed", payment_status: "paid" })
          }
          className="flex h-11 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium"
        >
          Paid & done
        </button>
      ) : null}
      {canCancel ? (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Cancel this order?")) {
              patch({ order_status: "cancelled" });
            }
          }}
          className="flex h-11 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium text-danger"
        >
          Cancel order
        </button>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function CancelOrderButton({
  orderId,
  status,
  className,
}: {
  orderId: string;
  status: OrderStatus;
  className?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const canCancel = status === "pending" || status === "accepted";
  if (!canCancel) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <button
        type="button"
        onClick={() => {
          if (!window.confirm("Cancel this order?")) {
            return;
          }
          setError(null);
          void patchMerchantOrderOptimistic(orderId, {
            order_status: "cancelled",
          }).then((result) => {
            if (!result.ok) {
              setError(result.error);
            }
          });
        }}
        className={
          className ??
          "flex h-11 w-full items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium text-danger"
        }
      >
        Cancel
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
