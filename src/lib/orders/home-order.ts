import type { OrderWithItems } from "@/lib/orders/types";
import type { OrderSource, OrderStatus, PaymentStatus } from "@/lib/types/database";

export type HomeOrder = {
  id: string;
  order_number: string;
  order_status: OrderStatus;
  order_source: OrderSource;
  payment_status: PaymentStatus;
  is_takeaway: boolean;
  total_amount: number;
  item_count: number;
  created_at: string;
  items: { quantity: number; item_name: string }[];
};

export function toHomeOrder(order: OrderWithItems): HomeOrder {
  return {
    id: order.id,
    order_number: order.order_number,
    order_status: order.order_status,
    order_source: order.order_source,
    payment_status: order.payment_status,
    is_takeaway: order.is_takeaway === true,
    total_amount: order.total_amount,
    item_count: order.item_count,
    created_at: order.created_at,
    items: order.items.map((item) => ({
      quantity: item.quantity,
      item_name: item.item_name,
    })),
  };
}
