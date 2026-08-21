import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parsePrice } from "@/lib/money";
import {
  buildReceiptDocument,
  summarizeReceiptItems,
} from "@/lib/receipts/build-receipt";
import type {
  SalesItemQty,
  SalesPaymentTotal,
  SalesReportDocument,
} from "@/lib/receipts/types";
import { withItems, type OrderWithItems } from "@/lib/orders/types";
import {
  formatDateIst,
  isValidDateKey,
  shiftDateKey,
  startOfDayIsoInIndia,
  todayDateKeyInIndia,
} from "@/lib/time";
import type { Order, OrderItem, PaymentMethod, Store } from "@/lib/types/database";

export type SalesReport = {
  dateKey: string;
  todayCount: number;
  todaySales: number;
  todayPaidSales: number;
  unpaidAmount: number;
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
  takeawayCount: number;
  dineInCount: number;
  customersToday: number;
  itemSales: SalesItemQty[];
  paymentPaid: SalesPaymentTotal[];
  todayOrders: OrderWithItems[];
};

function isEligibleSale(order: Order) {
  return order.order_status !== "cancelled" && order.payment_status !== "refunded";
}

export async function getSalesReport(
  storeId: string,
  dateKey: string = todayDateKeyInIndia(),
): Promise<SalesReport> {
  if (!isValidDateKey(dateKey)) {
    throw new Error("Invalid report date");
  }

  const supabase = getSupabaseAdmin();
  const dayStart = startOfDayIsoInIndia(dateKey);
  const nextDayStart = startOfDayIsoInIndia(shiftDateKey(dateKey, 1));
  const isToday = dateKey === todayDateKeyInIndia();

  const [
    { data: dayRows, error: dayError },
    pendingResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .gte("created_at", dayStart)
      .lt("created_at", nextDayStart)
      .order("created_at", { ascending: true }),
    isToday
      ? supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId)
          .eq("order_status", "pending")
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (dayError) {
    throw dayError;
  }
  if (pendingResult.error) {
    throw pendingResult.error;
  }

  const dayOrders = (dayRows ?? []) as Order[];
  const eligible = dayOrders.filter(isEligibleSale);
  const todaySales = eligible.reduce(
    (sum, row) => sum + (parsePrice(row.total_amount) ?? 0),
    0,
  );
  const paidOrders = eligible.filter((row) => row.payment_status === "paid");
  const todayPaidSales = paidOrders.reduce(
    (sum, row) => sum + (parsePrice(row.total_amount) ?? 0),
    0,
  );
  const unpaidAmount = eligible
    .filter((row) => row.payment_status === "unpaid")
    .reduce((sum, row) => sum + (parsePrice(row.total_amount) ?? 0), 0);

  const customers = new Set(
    eligible.map((row) => row.customer_phone || row.customer_name || row.id),
  );

  const orderIds = dayOrders.map((order) => order.id);
  const itemsByOrder = await loadItems(orderIds);
  const todayOrders = dayOrders.map((order) =>
    withItems(order, itemsByOrder.get(order.id) ?? []),
  );
  const eligibleWithItems = todayOrders.filter((order) =>
    isEligibleSale(order),
  );

  return {
    dateKey,
    todayCount: eligible.length,
    todaySales: roundMoney(todaySales),
    todayPaidSales: roundMoney(todayPaidSales),
    unpaidAmount: roundMoney(unpaidAmount),
    pendingCount: isToday
      ? (pendingResult.count ?? 0)
      : dayOrders.filter((row) => row.order_status === "pending").length,
    completedCount: dayOrders.filter((row) => row.order_status === "completed")
      .length,
    cancelledCount: dayOrders.filter((row) => row.order_status === "cancelled")
      .length,
    takeawayCount: eligible.filter((row) => row.is_takeaway).length,
    dineInCount: eligible.filter((row) => !row.is_takeaway).length,
    customersToday: customers.size,
    itemSales: aggregateItemSales(eligibleWithItems),
    paymentPaid: aggregatePaymentPaid(paidOrders),
    todayOrders,
  };
}

export function toSalesReportDocument(
  report: SalesReport,
  store: Pick<Store, "name" | "phone">,
): SalesReportDocument {
  const eligible = report.todayOrders.filter(isEligibleSale);

  return {
    storeName: store.name,
    dateKey: report.dateKey,
    dateLabel: formatDateIst(report.dateKey),
    orderCount: report.todayCount,
    totalSales: report.todaySales,
    itemSales: report.itemSales,
    paymentPaid: report.paymentPaid,
    unpaidAmount: report.unpaidAmount,
    index: eligible.map((order) => ({
      orderNumber: order.order_number,
      itemsSummary: summarizeReceiptItems(order.items),
      amount: order.total_amount,
    })),
    receipts: eligible.map((order) =>
      buildReceiptDocument(order, {
        name: store.name,
        phone: store.phone,
      }),
    ),
  };
}

function aggregateItemSales(orders: OrderWithItems[]): SalesItemQty[] {
  const map = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      map.set(item.item_name, (map.get(item.item_name) ?? 0) + item.quantity);
    }
  }
  return [...map.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}

function aggregatePaymentPaid(orders: Order[]): SalesPaymentTotal[] {
  const map = new Map<PaymentMethod, number>();
  for (const order of orders) {
    const amount = parsePrice(order.total_amount) ?? 0;
    map.set(order.payment_method, (map.get(order.payment_method) ?? 0) + amount);
  }
  const orderMethods: PaymentMethod[] = ["cash", "upi", "card", "other"];
  return orderMethods
    .filter((method) => (map.get(method) ?? 0) > 0)
    .map((method) => ({
      method,
      amount: roundMoney(map.get(method) ?? 0),
    }));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
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
