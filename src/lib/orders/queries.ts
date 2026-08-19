import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { startOfTodayIsoInIndia } from "@/lib/time";
import { parsePrice } from "@/lib/money";
import { statusesForFilter, type MerchantOrderFilter, type OrderFilterCounts } from "@/lib/orders/status";
import { withItems, type OrderWithItems } from "@/lib/orders/types";
import type { Order, OrderItem, OrderStatus } from "@/lib/types/database";

const LIST_LIMIT = 80;
const RECENT_LIMIT = 8;

async function loadItemsByOrderId(orderIds: string[]) {
  if (orderIds.length === 0) {
    return new Map<string, OrderItem[]>();
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

  const grouped = new Map<string, OrderItem[]>();
  for (const item of (data ?? []) as OrderItem[]) {
    const list = grouped.get(item.order_id) ?? [];
    list.push(item);
    grouped.set(item.order_id, list);
  }
  return grouped;
}

function attachItems(orders: Order[], grouped: Map<string, OrderItem[]>): OrderWithItems[] {
  return orders.map((order) => withItems(order, grouped.get(order.id) ?? []));
}

export async function getMerchantOrders(
  storeId: string,
  filter: MerchantOrderFilter,
): Promise<OrderWithItems[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  const statuses = statusesForFilter(filter);
  if (statuses) {
    query = query.in("order_status", statuses);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const orders = (data ?? []) as Order[];
  const grouped = await loadItemsByOrderId(orders.map((order) => order.id));
  return attachItems(orders, grouped);
}

export async function getMerchantOrder(
  storeId: string,
  orderId: string,
): Promise<OrderWithItems | null> {
  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error || !order) {
    return null;
  }

  const grouped = await loadItemsByOrderId([order.id]);
  return withItems(order as Order, grouped.get(order.id) ?? []);
}

export async function getOrderFilterCounts(storeId: string): Promise<OrderFilterCounts> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("order_status")
    .eq("store_id", storeId);

  if (error) {
    throw error;
  }

  const statuses = ((data ?? []) as { order_status: OrderStatus }[]).map(
    (row) => row.order_status,
  );

  return {
    all: statuses.length,
    new: statuses.filter((status) => status === "pending").length,
    preparing: statuses.filter(
      (status) => status === "accepted" || status === "preparing",
    ).length,
    ready: statuses.filter((status) => status === "ready").length,
    completed: statuses.filter((status) => status === "completed").length,
  };
}

export type DashboardStats = {
  todayCount: number;
  todaySales: number;
  pendingCount: number;
  newCustomersToday: number;
  recent: OrderWithItems[];
};

export async function getDashboardStats(storeId: string): Promise<DashboardStats> {
  const supabase = getSupabaseAdmin();
  const todayStart = startOfTodayIsoInIndia();

  const [
    { data: todayRows, error: todayError },
    { count: pendingCount, error: pendingError },
    { data: recentRows, error: recentError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total_amount, order_status, customer_phone, customer_name")
      .eq("store_id", storeId)
      .gte("created_at", todayStart),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("order_status", "pending"),
    supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
  ]);

  if (todayError) {
    throw todayError;
  }
  if (pendingError) {
    throw pendingError;
  }
  if (recentError) {
    throw recentError;
  }

  const today = (todayRows ?? []) as {
    id: string;
    total_amount: number;
    order_status: OrderStatus;
    customer_phone: string | null;
    customer_name: string | null;
  }[];
  const activeToday = today.filter((row) => row.order_status !== "cancelled");
  const todaySales = activeToday.reduce(
    (sum, row) => sum + (parsePrice(row.total_amount) ?? 0),
    0,
  );
  const customers = new Set(
    activeToday.map(
      (row) => row.customer_phone || row.customer_name || row.id,
    ),
  );

  const recentOrders = (recentRows ?? []) as Order[];
  const grouped = await loadItemsByOrderId(recentOrders.map((order) => order.id));

  return {
    todayCount: activeToday.length,
    todaySales: Math.round(todaySales * 100) / 100,
    pendingCount: pendingCount ?? 0,
    newCustomersToday: customers.size,
    recent: attachItems(recentOrders, grouped),
  };
}

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
];

export async function getActiveOpsOrders(
  storeId: string,
): Promise<OrderWithItems[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .in("order_status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    throw error;
  }

  const orders = (data ?? []) as Order[];
  const grouped = await loadItemsByOrderId(orders.map((order) => order.id));
  return attachItems(orders, grouped);
}
