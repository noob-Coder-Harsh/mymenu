"use client";

import { useEffect, useState } from "react";
import { ReceiptDownloadButton } from "@/components/receipts/receipt-download-button";
import { useMerchantOrder } from "../../_components/merchant-order-provider";
import { upsertMerchantOrder } from "@/lib/orders/merchant-order-store";
import { canTogglePayment } from "@/lib/orders/status";
import type { OrderWithItems } from "@/lib/orders/types";
import { formatInr } from "@/lib/money";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatTimeIst } from "@/lib/time";
import { ORDER_SOURCE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/types/labels";
import {
  CancelOrderButton,
  OrderStatusActions,
} from "./order-status-actions";
import { OrderStatusBadge } from "./order-status-badge";
import { PaymentToggle } from "./payment-toggle";

export function OrderDetailClient({
  orderId,
  storeName,
  storePhone,
}: {
  orderId: string;
  storeName: string;
  storePhone: string | null;
}) {
  const order = useMerchantOrder(orderId);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (order) {
      setFetchError(null);
      setFetching(false);
      return;
    }

    let cancelled = false;
    setFetching(true);
    setFetchError(null);

    async function load() {
      try {
        const response = await fetch(`/api/merchant/orders/${orderId}`, {
          credentials: "include",
        });
        const data = (await response.json()) as {
          error?: string;
          order?: OrderWithItems;
        };
        if (!response.ok || !data.order) {
          if (!cancelled) {
            setFetchError(data.error || "Order not found");
            setFetching(false);
          }
          return;
        }
        upsertMerchantOrder(data.order, { force: true });
        if (!cancelled) {
          setFetching(false);
        }
      } catch (reason) {
        if (!cancelled) {
          setFetchError(
            reason instanceof Error ? reason.message : "Could not load order",
          );
          setFetching(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [order, orderId]);

  if (order) {
    const canCancel =
      order.order_status === "pending" || order.order_status === "accepted";
    const receiptOrder = {
      order_number: order.order_number,
      created_at: order.created_at,
      is_takeaway: order.is_takeaway,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      notes: order.notes,
      items: order.items.map((item) => ({
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount,
      })),
    };

    return (
      <section className="flex flex-col gap-3">
        {/* Compact header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                #{order.order_number}
              </h1>
              <OrderStatusBadge status={order.order_status} />
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {formatTimeIst(order.created_at)}
              {order.order_source === "counter"
                ? ` · ${ORDER_SOURCE_LABELS.counter}`
                : ""}
              {order.is_takeaway ? " · Takeaway" : ""}
              {" · "}
              {formatInr(order.total_amount)}
            </p>
          </div>
        </div>

        {/* Fast actions — above the fold */}
        <OrderStatusActions
          orderId={order.id}
          status={order.order_status}
          includeCancel={false}
        />

        <PaymentToggle
          orderId={order.id}
          paymentStatus={order.payment_status}
          disabled={!canTogglePayment(order.order_status)}
          methodLabel={PAYMENT_METHOD_LABELS[order.payment_method]}
        />

        <div className={`grid gap-2 ${canCancel ? "grid-cols-2" : "grid-cols-1"}`}>
          <CancelOrderButton orderId={order.id} status={order.order_status} />
          <ReceiptDownloadButton
            format="pdf"
            label="Download bill"
            storeName={storeName}
            storePhone={storePhone}
            order={receiptOrder}
            className="flex h-11 w-full items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium disabled:opacity-60"
          />
        </div>

        {/* Details below */}
        <section className="rounded-2xl border border-border bg-surface px-3.5 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-bold tracking-wide text-muted uppercase">
              Items
            </p>
            <p className="text-xs text-muted">
              {order.customer_name || "Guest"}
              {order.customer_phone
                ? ` · ${formatPhoneDisplay(order.customer_phone)}`
                : ""}
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold">{item.quantity} ×</span>{" "}
                  {item.item_name}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatInr(item.total_amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatInr(order.total_amount)}</span>
          </div>
          {order.notes ? (
            <p className="mt-2 border-t border-dashed border-border pt-2 text-sm text-muted">
              Note: {order.notes}
            </p>
          ) : null}
        </section>
      </section>
    );
  }

  if (fetching || !fetchError) {
    return (
      <section className="flex flex-col gap-3">
        <p className="text-sm text-muted">Loading order…</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-danger">{fetchError}</p>
    </section>
  );
}
