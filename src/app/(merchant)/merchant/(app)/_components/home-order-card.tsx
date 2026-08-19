import Link from "next/link";
import { formatInr } from "@/lib/money";
import { formatTimeIst } from "@/lib/time";
import { ORDER_STATUS_LABELS } from "@/lib/types/labels";
import type { HomeOrder } from "@/lib/orders/home-order";
import { IconChevron } from "./icons";

export function HomeOrderCard({
  order,
  highlight,
}: {
  order: HomeOrder;
  highlight: boolean;
}) {
  return (
    <Link
      href={`/merchant/orders/${order.id}`}
      className={`flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 ${
        highlight
          ? "border-accent shadow-[0_0_0_2px_rgba(196,92,38,0.16)]"
          : "border-border"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">#{order.order_number}</p>
          <span className="shrink-0 text-[11px] font-semibold text-accent">
            {ORDER_STATUS_LABELS[order.order_status]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {order.item_count} {order.item_count === 1 ? "item" : "items"} ·{" "}
          {formatTimeIst(order.created_at)}
        </p>
      </div>
      <p className="text-sm font-semibold">{formatInr(order.total_amount)}</p>
      <IconChevron className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
