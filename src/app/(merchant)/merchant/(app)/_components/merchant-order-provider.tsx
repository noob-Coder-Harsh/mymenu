"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { HomeOrder } from "@/lib/orders/home-order";
import {
  getActiveHomeOrdersFromStore,
  getMerchantOrderFromStore,
  getMerchantOrderStoreVersion,
  subscribeMerchantOrders,
} from "@/lib/orders/merchant-order-store";
import type { OrderWithItems } from "@/lib/orders/types";

/** Marks the merchant app subtree as the order-cache boundary (store is a module singleton). */
export function MerchantOrderProvider({ children }: { children: ReactNode }) {
  return children;
}

function useStoreVersion() {
  return useSyncExternalStore(
    subscribeMerchantOrders,
    getMerchantOrderStoreVersion,
    () => 0,
  );
}

export function useMerchantOrder(orderId: string): OrderWithItems | undefined {
  useStoreVersion();
  return getMerchantOrderFromStore(orderId);
}

export function useActiveHomeOrders(): HomeOrder[] {
  useStoreVersion();
  return getActiveHomeOrdersFromStore();
}
