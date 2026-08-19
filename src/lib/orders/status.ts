import type { OrderStatus, PaymentStatus } from "@/lib/types/database";

export type MerchantOrderFilter = "all" | "new" | "preparing" | "ready" | "completed";

export type OrderFilterCounts = Record<MerchantOrderFilter, number>;

export const ORDER_FILTERS: { id: MerchantOrderFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
];

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export const PRIMARY_STATUS_ACTION: Partial<
  Record<OrderStatus, { to: OrderStatus; label: string }>
> = {
  pending: { to: "accepted", label: "Accept order" },
  accepted: { to: "preparing", label: "Start preparing" },
  preparing: { to: "ready", label: "Mark ready" },
  ready: { to: "completed", label: "Hand over" },
};

export function parseOrderFilter(value: string | undefined | null): MerchantOrderFilter {
  if (
    value === "new" ||
    value === "preparing" ||
    value === "ready" ||
    value === "completed"
  ) {
    return value;
  }
  return "all";
}

export function statusesForFilter(filter: MerchantOrderFilter): OrderStatus[] | null {
  switch (filter) {
    case "new":
      return ["pending"];
    case "preparing":
      return ["accepted", "preparing"];
    case "ready":
      return ["ready"];
    case "completed":
      return ["completed"];
    default:
      return null;
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function canTogglePayment(status: OrderStatus) {
  return status !== "cancelled";
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return value === "unpaid" || value === "paid";
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (
    value === "pending" ||
    value === "accepted" ||
    value === "preparing" ||
    value === "ready" ||
    value === "completed" ||
    value === "cancelled"
  );
}

export function isTerminalStatus(status: OrderStatus) {
  return status === "completed" || status === "cancelled";
}
