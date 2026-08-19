"use client";

import { useEffect, useState } from "react";
import { OrderStatusStepper } from "@/components/order-status-stepper";
import { isTerminalStatus } from "@/lib/orders/status";
import { formatInr } from "@/lib/money";
import {
  CUSTOMER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types/labels";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types/database";

type LiveOrder = {
  order_number: string;
  order_status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  total_amount: number;
};

export function OrderStatusLive({
  slug,
  orderId,
  initial,
  upiId,
}: {
  slug: string;
  orderId: string;
  initial: LiveOrder;
  upiId: string | null;
}) {
  const [order, setOrder] = useState(initial);

  useEffect(() => {
    if (isTerminalStatus(order.order_status)) {
      return;
    }

    const poll = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      const response = await fetch(`/api/orders/${orderId}?slug=${encodeURIComponent(slug)}`);
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { order?: LiveOrder };
      if (data.order) {
        setOrder({
          order_number: data.order.order_number,
          order_status: data.order.order_status,
          payment_method: data.order.payment_method,
          payment_status: data.order.payment_status,
          total_amount: data.order.total_amount,
        });
      }
    };

    const id = window.setInterval(() => {
      void poll();
    }, 4000);
    return () => window.clearInterval(id);
  }, [order.order_status, orderId, slug]);

  const headline =
    order.order_status === "ready"
      ? "Your order is ready. Please collect it."
      : order.order_status === "completed"
        ? "Order completed. Enjoy!"
        : order.order_status === "cancelled"
          ? "This order was cancelled."
          : `${CUSTOMER_STATUS_LABELS[order.order_status]} · updating live`;

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-muted">Order number</p>
        <p className="text-lg font-semibold">#{order.order_number}</p>
        <p className="mt-1 text-sm text-muted">
          {PAYMENT_METHOD_LABELS[order.payment_method]} · {formatInr(order.total_amount)} ·{" "}
          {PAYMENT_STATUS_LABELS[order.payment_status]}
        </p>
      </section>

      {order.payment_method === "upi" && order.payment_status !== "paid" ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-medium">Pay with UPI</p>
          {upiId ? (
            <p className="mt-1 break-all text-lg font-semibold">{upiId}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">Pay at the counter using UPI.</p>
          )}
          <p className="mt-2 text-sm text-muted">
            No online payment capture. Complete UPI at the counter or to this ID, then the store
            will mark it paid.
          </p>
        </section>
      ) : order.payment_method === "cash" && order.payment_status !== "paid" ? (
        <section className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
          Pay cash at the counter when you collect your order.
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-4 text-sm text-success">
          Payment marked paid by the store.
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">Status</h2>
        <p className="mt-1 text-sm text-muted">{headline}</p>
        <div className="mt-3">
          <OrderStatusStepper status={order.order_status} />
        </div>
      </section>
    </>
  );
}
