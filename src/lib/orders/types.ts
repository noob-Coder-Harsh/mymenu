import type { Order, OrderItem } from "@/lib/types/database";
import { parsePrice } from "@/lib/money";

export type OrderItemView = Omit<OrderItem, "unit_price" | "total_amount"> & {
  unit_price: number;
  total_amount: number;
};

export type OrderRecord = Omit<Order, "subtotal" | "total_amount"> & {
  subtotal: number;
  total_amount: number;
};

export type OrderWithItems = OrderRecord & {
  items: OrderItemView[];
  item_count: number;
};

export function normalizeOrder(order: Order): OrderRecord {
  return {
    ...order,
    subtotal: parsePrice(order.subtotal) ?? 0,
    total_amount: parsePrice(order.total_amount) ?? 0,
  };
}

export function normalizeOrderItem(item: OrderItem): OrderItemView {
  return {
    ...item,
    unit_price: parsePrice(item.unit_price) ?? 0,
    total_amount: parsePrice(item.total_amount) ?? 0,
  };
}

export function withItems(order: Order, items: OrderItem[]): OrderWithItems {
  const normalizedItems = items.map(normalizeOrderItem);
  return {
    ...normalizeOrder(order),
    items: normalizedItems,
    item_count: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}
