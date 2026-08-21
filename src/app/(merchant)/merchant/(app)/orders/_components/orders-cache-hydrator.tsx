"use client";

import { useLayoutEffect } from "react";
import { upsertMerchantOrders } from "@/lib/orders/merchant-order-store";
import type { OrderWithItems } from "@/lib/orders/types";

/** Warms the in-memory order cache from SSR list data (for fast detail opens). */
export function OrdersCacheHydrator({ orders }: { orders: OrderWithItems[] }) {
  useLayoutEffect(() => {
    upsertMerchantOrders(orders);
  }, [orders]);
  return null;
}
