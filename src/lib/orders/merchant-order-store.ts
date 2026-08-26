import { toHomeOrder, type HomeOrder } from "@/lib/orders/home-order";
import type { OrderWithItems } from "@/lib/orders/types";
import type { OrderStatus, PaymentStatus } from "@/lib/types/database";

const ACTIVE_STATUSES = new Set<OrderStatus>([
  "pending",
  "accepted",
  "preparing",
  "ready",
]);

type PatchBody = {
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
};

const byId = new Map<string, OrderWithItems>();
/** Ids shown on the home ops board (from last active sync + local creates). */
const activeIds = new Set<string>();
/** Counter (or other) creates not yet confirmed in an active poll. */
const localActiveIds = new Set<string>();
/** In-flight optimistic PATCH counts per order. */
const pendingPatches = new Map<string, number>();

let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

function isActiveStatus(status: OrderStatus) {
  return ACTIVE_STATUSES.has(status);
}

function cloneOrder(order: OrderWithItems): OrderWithItems {
  return {
    ...order,
    items: order.items.map((item) => ({ ...item })),
  };
}

function touchUpdatedAt(order: OrderWithItems): OrderWithItems {
  return {
    ...order,
    updated_at: new Date().toISOString(),
  };
}

function parseTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function shouldReplace(existing: OrderWithItems | undefined, next: OrderWithItems) {
  if (!existing) {
    return true;
  }
  return parseTime(next.updated_at) >= parseTime(existing.updated_at);
}

function beginPending(orderId: string) {
  pendingPatches.set(orderId, (pendingPatches.get(orderId) ?? 0) + 1);
  emit();
}

function endPending(orderId: string) {
  const count = pendingPatches.get(orderId) ?? 0;
  if (count <= 1) {
    pendingPatches.delete(orderId);
  } else {
    pendingPatches.set(orderId, count - 1);
  }
  emit();
}

export function isMerchantOrderPatchPending(orderId: string) {
  return (pendingPatches.get(orderId) ?? 0) > 0;
}

function syncActiveMembership(order: OrderWithItems) {
  if (isActiveStatus(order.order_status)) {
    activeIds.add(order.id);
    return;
  }
  activeIds.delete(order.id);
  localActiveIds.delete(order.id);
}

export function subscribeMerchantOrders(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMerchantOrderStoreVersion() {
  return version;
}

export function getMerchantOrderFromStore(orderId: string) {
  return byId.get(orderId);
}

export function upsertMerchantOrder(order: OrderWithItems, options?: { force?: boolean }) {
  const existing = byId.get(order.id);
  if (!options?.force && !shouldReplace(existing, order)) {
    return;
  }
  byId.set(order.id, order);
  if (
    localActiveIds.has(order.id) ||
    activeIds.has(order.id) ||
    isActiveStatus(order.order_status)
  ) {
    syncActiveMembership(order);
  }
  emit();
}

export function upsertMerchantOrders(orders: OrderWithItems[], options?: { force?: boolean }) {
  let changed = false;
  for (const order of orders) {
    const existing = byId.get(order.id);
    if (!options?.force && !shouldReplace(existing, order)) {
      continue;
    }
    byId.set(order.id, order);
    changed = true;
  }
  if (changed) {
    emit();
  }
}

/** Replace home active set from a full active-ops poll / SSR snapshot. */
export function syncActiveMerchantOrders(orders: OrderWithItems[]) {
  const pollIds = new Set(orders.map((order) => order.id));

  for (const order of orders) {
    const existing = byId.get(order.id);
    if (shouldReplace(existing, order)) {
      byId.set(order.id, order);
    }
    localActiveIds.delete(order.id);
  }

  const nextActive = new Set<string>();
  for (const id of pollIds) {
    const order = byId.get(id);
    if (order && isActiveStatus(order.order_status)) {
      nextActive.add(id);
    }
  }

  for (const id of localActiveIds) {
    const order = byId.get(id);
    if (order && isActiveStatus(order.order_status)) {
      nextActive.add(id);
    }
  }

  for (const [id, count] of pendingPatches) {
    if (count < 1) {
      continue;
    }
    const order = byId.get(id);
    if (order && isActiveStatus(order.order_status)) {
      nextActive.add(id);
    }
  }

  activeIds.clear();
  for (const id of nextActive) {
    activeIds.add(id);
  }
  emit();
}

/**
 * Apply incremental order rows (any status). Active statuses join the board;
 * terminal statuses leave it. Does not drop unchanged active orders.
 */
export function applyActiveOrderDelta(orders: OrderWithItems[]) {
  if (orders.length === 0) {
    return;
  }

  let changed = false;
  for (const order of orders) {
    const existing = byId.get(order.id);
    if (!shouldReplace(existing, order)) {
      continue;
    }
    byId.set(order.id, order);
    localActiveIds.delete(order.id);
    syncActiveMembership(order);
    changed = true;
  }

  if (changed) {
    emit();
  }
}

/** After counter create — keep on home until the next poll includes it. */
export function addLocalActiveMerchantOrder(order: OrderWithItems) {
  byId.set(order.id, order);
  if (isActiveStatus(order.order_status)) {
    localActiveIds.add(order.id);
    activeIds.add(order.id);
  }
  emit();
}

export function getActiveHomeOrdersFromStore(): HomeOrder[] {
  const orders: HomeOrder[] = [];
  for (const id of activeIds) {
    const order = byId.get(id);
    if (order && isActiveStatus(order.order_status)) {
      orders.push(toHomeOrder(order));
    }
  }
  return orders;
}

export function applyMerchantOrderOptimistic(
  orderId: string,
  patch: PatchBody,
): OrderWithItems | null {
  const existing = byId.get(orderId);
  if (!existing) {
    return null;
  }
  const previous = cloneOrder(existing);
  const next = touchUpdatedAt({
    ...existing,
    ...(patch.order_status !== undefined
      ? { order_status: patch.order_status }
      : {}),
    ...(patch.payment_status !== undefined
      ? { payment_status: patch.payment_status }
      : {}),
  });
  byId.set(orderId, next);
  syncActiveMembership(next);
  emit();
  return previous;
}

export function restoreMerchantOrder(previous: OrderWithItems) {
  byId.set(previous.id, previous);
  syncActiveMembership(previous);
  if (isActiveStatus(previous.order_status)) {
    activeIds.add(previous.id);
  }
  emit();
}

export async function patchMerchantOrderOptimistic(
  orderId: string,
  body: PatchBody,
): Promise<{ ok: true; order: OrderWithItems } | { ok: false; error: string }> {
  if ((pendingPatches.get(orderId) ?? 0) > 0) {
    return { ok: false, error: "Update already in progress" };
  }

  const previous = applyMerchantOrderOptimistic(orderId, body);
  beginPending(orderId);

  try {
    const response = await fetch(`/api/merchant/orders/${orderId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as {
      error?: string;
      order?: OrderWithItems;
    };
    if (!response.ok || !data.order) {
      if (previous) {
        restoreMerchantOrder(previous);
      }
      return { ok: false, error: data.error || "Could not update order" };
    }
    upsertMerchantOrder(data.order, { force: true });
    return { ok: true, order: data.order };
  } catch (reason) {
    if (previous) {
      restoreMerchantOrder(previous);
    }
    return {
      ok: false,
      error: reason instanceof Error ? reason.message : "Could not update order",
    };
  } finally {
    endPending(orderId);
  }
}
