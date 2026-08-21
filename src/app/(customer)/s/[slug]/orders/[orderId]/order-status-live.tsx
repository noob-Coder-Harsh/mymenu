"use client";

import { useEffect, useState } from "react";
import { OrderStatusStepper } from "@/components/order-status-stepper";
import {
  StatusSeal,
  type StatusSealIcon,
} from "@/components/ui/status-seal";
import { isTerminalStatus } from "@/lib/orders/status";
import { formatInr } from "@/lib/money";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types/labels";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types/database";

type LiveOrder = {
  order_number: string;
  order_status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  is_takeaway: boolean;
  total_amount: number;
};

function statusPresentation(status: OrderStatus): {
  title: string;
  detail: string;
  shell: string;
  color: string;
  icon: StatusSealIcon;
} {
  switch (status) {
    case "pending":
      return {
        title: "Order placed",
        detail: "We have received your order.",
        shell: "border-accent/25 bg-accent/10",
        color: "#a65d37",
        icon: "clock",
      };
    case "accepted":
      return {
        title: "Accepted",
        detail: "The kitchen has your order.",
        shell: "border-accent/20 bg-accent/10",
        color: "#a65d37",
        icon: "check",
      };
    case "preparing":
      return {
        title: "Preparing",
        detail: "Your order is being made.",
        shell: "border-[#b9892d]/30 bg-[#b9892d]/10",
        color: "#b9892d",
        icon: "cook",
      };
    case "ready":
      return {
        title: "Ready for pickup",
        detail: "Please collect your order.",
        shell: "border-success/30 bg-success/10",
        color: "#00a63e",
        icon: "ready",
      };
    case "completed":
      return {
        title: "Completed",
        detail: "Enjoy your order!",
        shell: "border-success/25 bg-success/10",
        color: "#00a63e",
        icon: "check",
      };
    case "cancelled":
      return {
        title: "Cancelled",
        detail: "This order was cancelled.",
        shell: "border-danger/30 bg-danger/10",
        color: "#b42318",
        icon: "x",
      };
  }
}

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
          is_takeaway: data.order.is_takeaway === true,
          total_amount: data.order.total_amount,
        });
      }
    };

    const id = window.setInterval(() => {
      void poll();
    }, 4000);
    return () => window.clearInterval(id);
  }, [order.order_status, orderId, slug]);

  const presentation = statusPresentation(order.order_status);

  return (
    <>
      <section
        className={`rounded-2xl border px-4 py-6 text-center shadow-[0_1px_0_rgba(44,24,16,0.03)] ${presentation.shell}`}
      >
        <StatusSeal
          color={presentation.color}
          icon={presentation.icon}
          label={presentation.title}
          className="mx-auto h-24 w-24"
        />
        <h1 className="mt-4 text-xl font-bold tracking-tight">{presentation.title}</h1>
        <p className="font-script mt-1 text-[17px] text-muted">{presentation.detail}</p>
        {!isTerminalStatus(order.order_status) ? (
          <>
            <p className="mt-3 text-[11px] font-medium tracking-wide text-muted uppercase">
              Updates automatically
            </p>
            <p className="font-script mt-1 text-[15px] text-muted">
              Stay on this screen for live status.
            </p>
          </>
        ) : null}
      </section>

      {order.order_status !== "cancelled" ? (
        <section className="customer-card p-4">
          <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
            Status
          </p>
          <OrderStatusStepper status={order.order_status} />
        </section>
      ) : null}

      <section className="customer-card p-4">
        <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
          Order number
        </p>
        <p className="mt-1 text-lg font-bold tracking-tight">#{order.order_number}</p>
        <p className="mt-1 text-sm text-muted">
          {PAYMENT_METHOD_LABELS[order.payment_method]} · {formatInr(order.total_amount)} ·{" "}
          {PAYMENT_STATUS_LABELS[order.payment_status]}
          {order.is_takeaway ? " · Takeaway" : " · Eat in"}
        </p>
      </section>

      {order.payment_method === "upi" && order.payment_status !== "paid" ? (
        <section className="customer-card p-4">
          <p className="text-[15px] font-semibold">Pay with UPI</p>
          {upiId ? (
            <p className="mt-1 break-all text-lg font-bold tracking-tight">{upiId}</p>
          ) : (
            <p className="font-script mt-1 text-[15px] text-muted">
              Pay at the counter using UPI.
            </p>
          )}
          <p className="font-script mt-2 text-[15px] leading-snug text-muted">
            Complete UPI at the counter or to this ID, then the store will mark it paid.
          </p>
        </section>
      ) : order.payment_method === "cash" && order.payment_status !== "paid" ? (
        <section className="customer-card p-4">
          <p className="font-script text-[16px] text-muted">
            Pay cash at the counter when you collect your order.
          </p>
        </section>
      ) : (
        <section className="customer-card border-success/25 bg-success/10 p-4">
          <p className="text-sm font-semibold text-success">
            Payment marked paid by the store.
          </p>
        </section>
      )}
    </>
  );
}
