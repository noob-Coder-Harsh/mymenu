import { ORDER_STATUS_LABELS } from "@/lib/types/labels";
import type { OrderStatus } from "@/lib/types/database";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "cancelled"
      ? "bg-danger/10 text-danger"
      : status === "ready" || status === "completed"
        ? "bg-success/10 text-success"
        : status === "pending"
          ? "bg-accent/10 text-accent"
          : "bg-background text-muted";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
