"use client";

import { formatInr } from "@/lib/money";
import { orderCardOutlineClass } from "@/lib/orders/card-outline";
import { formatTimeIst } from "@/lib/time";
import { ORDER_SOURCE_LABELS, ORDER_STATUS_LABELS } from "@/lib/types/labels";
import type { HomeOrder } from "@/lib/orders/home-order";
import { IconChevron } from "./icons";
import { PendingLink } from "./pending-link";

export function HomeOrderCard({
  order,
  highlight,
}: {
  order: HomeOrder;
  highlight: boolean;
}) {
  const outline = orderCardOutlineClass(order.order_status, order.payment_status);

  return (
    <PendingLink
      href={`/merchant/orders/${order.id}`}
      variant="card"
      className={`flex items-center gap-3 rounded-xl border-2 bg-surface px-3 py-2.5 ${outline} ${
        highlight ? "shadow-[0_0_0_2px_rgba(196,92,38,0.2)]" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate text-sm font-semibold">#{order.order_number}</p>
          <span className="shrink-0 text-[11px] font-semibold text-foreground/80">
            {ORDER_STATUS_LABELS[order.order_status]}
          </span>
          {order.order_source === "counter" ? (
            <span className="shrink-0 text-[11px] font-medium text-muted">
              {ORDER_SOURCE_LABELS.counter}
            </span>
          ) : null}
          {order.is_takeaway ? (
            <span className="shrink-0 text-[11px] font-semibold text-accent">
              Takeaway
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {order.item_count} {order.item_count === 1 ? "item" : "items"} ·{" "}
          {formatTimeIst(order.created_at)}
        </p>
      </div>
      <p className="text-sm font-semibold">{formatInr(order.total_amount)}</p>
      <IconChevron className="h-4 w-4 shrink-0 text-muted" />
    </PendingLink>
  );
}
