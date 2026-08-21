import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { startOfTodayIsoInIndia } from "@/lib/time";
import { parsePrice } from "@/lib/money";
import { withItems, type OrderWithItems } from "@/lib/orders/types";
import type { Order, OrderItem } from "@/lib/types/database";

export type SalesReport = {
  todayCount: number;
  todaySales: number;
  todayPaidSales: number;
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
  takeawayCount: number;
  dineInCount: number;
  customersToday: number;
  todayOrders: OrderWithItems[];
};

export async function getSalesReport(storeId: string): Promise<SalesReport> {
  const supabase = getSupabaseAdmin();
  const todayStart = startOfTodayIsoInIndia();

  const [
    { data: todayRows, error: todayError },
    { count: pendingCount, error: pendingError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .gte("created_at", todayStart)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("order_status", "pending"),
  ]);

  if (todayError) {
    throw todayError;
  }
  if (pendingError) {
    throw pendingError;
  }

  const today = (todayRows ?? []) as Order[];
  const active = today.filter((row) => row.order_status !== "cancelled");
  const todaySales = active.reduce(
    (sum, row) => sum + (parsePrice(row.total_amount) ?? 0),
    0,
  );
  const todayPaidSales = active
    .filter((row) => row.payment_status === "paid")
    .reduce((sum, row) => sum + (parsePrice(row.total_amount) ?? 0), 0);

  const customers = new Set(
    active.map((row) => row.customer_phone || row.customer_name || row.id),
  );

  const orderIds = today.map((order) => order.id);
  const itemsByOrder = await loadItems(orderIds);

  return {
    todayCount: active.length,
    todaySales: Math.round(todaySales * 100) / 100,
    todayPaidSales: Math.round(todayPaidSales * 100) / 100,
    pendingCount: pendingCount ?? 0,
    completedCount: today.filter((row) => row.order_status === "completed").length,
    cancelledCount: today.filter((row) => row.order_status === "cancelled").length,
    takeawayCount: active.filter((row) => row.is_takeaway).length,
    dineInCount: active.filter((row) => !row.is_takeaway).length,
    customersToday: customers.size,
    todayOrders: today.map((order) =>
      withItems(order, itemsByOrder.get(order.id) ?? []),
    ),
  };
}

async function loadItems(orderIds: string[]) {
  const map = new Map<string, OrderItem[]>();
  if (orderIds.length === 0) {
    return map;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds)
    .order("created_at", { ascending: true });
  if (error) {
    throw error;
  }
  for (const item of (data ?? []) as OrderItem[]) {
    const list = map.get(item.order_id) ?? [];
    list.push(item);
    map.set(item.order_id, list);
  }
  return map;
}
