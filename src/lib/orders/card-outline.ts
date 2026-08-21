import type { OrderStatus, PaymentStatus } from "@/lib/types/database";

/** Colored outline for order cards by kitchen/payment state. */
export function orderCardOutlineClass(
  status: OrderStatus,
  paymentStatus?: PaymentStatus,
) {
  if (status === "cancelled") {
    return "border-danger/50 bg-danger/[0.03]";
  }
  if (status === "completed") {
    return paymentStatus === "paid"
      ? "border-success bg-success/[0.04]"
      : "border-success/45 bg-success/[0.03]";
  }
  if (status === "ready") {
    return "border-[#2f6fed]/55 bg-[#2f6fed]/[0.04]";
  }
  if (status === "preparing" || status === "accepted") {
    return "border-[#b9892d]/55 bg-[#b9892d]/[0.05]";
  }
  // pending / new
  return "border-accent/55 bg-accent/[0.04]";
}
