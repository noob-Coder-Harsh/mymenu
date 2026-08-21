import Link from "next/link";
import { formatInr } from "@/lib/money";
import { orderCardOutlineClass } from "@/lib/orders/card-outline";
import { formatTimeIst } from "@/lib/time";
import { ORDER_SOURCE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/types/labels";
import type { OrderWithItems } from "@/lib/orders/types";
import { OrderStatusBadge } from "./order-status-badge";

export function OrderCard({ order }: { order: OrderWithItems }) {
  const outline = orderCardOutlineClass(order.order_status, order.payment_status);

  return (
    <Link
      href={`/merchant/orders/${order.id}`}
      className={`flex flex-col gap-2 rounded-2xl border-2 bg-surface p-4 ${outline}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">#{order.order_number}</p>
          <p className="text-sm text-muted">
            {order.customer_name || "Guest"}
            {order.order_source === "counter" ? (
              <span className="text-muted"> · {ORDER_SOURCE_LABELS.counter}</span>
            ) : null}
            {order.is_takeaway ? (
              <span className="font-medium text-accent"> · Takeaway</span>
            ) : null}
          </p>
        </div>
        <OrderStatusBadge status={order.order_status} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          {order.item_count} {order.item_count === 1 ? "item" : "items"} ·{" "}
          {PAYMENT_METHOD_LABELS[order.payment_method]} · {formatTimeIst(order.created_at)}
        </span>
        <span className="font-semibold">{formatInr(order.total_amount)}</span>
      </div>
    </Link>
  );
}
