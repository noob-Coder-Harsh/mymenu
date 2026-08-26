"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toHomeOrder, type HomeOrder } from "@/lib/orders/home-order";
import {
  applyActiveOrderDelta,
  syncActiveMerchantOrders,
} from "@/lib/orders/merchant-order-store";
import type { OrderWithItems } from "@/lib/orders/types";
import type { OrderStatus } from "@/lib/types/database";
import { HomeOrderCard } from "./home-order-card";
import { HomeStoreFooter } from "./home-store-footer";
import { useActiveHomeOrders } from "./merchant-order-provider";
import { OrderAlertsPrompt, playOrderAlert } from "./order-alerts-prompt";
import { PullToRefresh } from "./pull-to-refresh";

const ORDERS_POLL_MS = 5 * 1000;
const FULL_SYNC_MS = 5 * 60 * 1000;
/** After backgrounding this long, prefer a full snapshot for accuracy. */
const FULL_SYNC_AFTER_HIDDEN_MS = 30 * 1000;

const SECTIONS: { id: string; title: string; statuses: OrderStatus[] }[] = [
  { id: "new", title: "New", statuses: ["pending"] },
  { id: "preparing", title: "Preparing", statuses: ["accepted", "preparing"] },
  { id: "ready", title: "Ready for pickup", statuses: ["ready"] },
];

type ActivePollResponse = {
  mode?: "delta" | "full";
  orders?: OrderWithItems[];
  syncedAt?: string;
};

export function HomeOps({
  orders: initialOrders,
  syncedAt: initialSyncedAt,
  storeName,
  slug,
  isOpen,
  description,
}: {
  orders: OrderWithItems[];
  syncedAt: string;
  storeName: string;
  slug: string;
  isOpen: boolean;
  description: string | null;
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const syncedAtRef = useRef(initialSyncedAt);
  const hiddenAtRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  const initialKey = initialOrders
    .map((order) => `${order.id}:${order.updated_at}:${order.order_status}`)
    .join("|");

  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    syncActiveMerchantOrders(initialOrders);
    syncedAtRef.current = initialSyncedAt;
    setMounted(true);
  }, [initialKey, initialOrders, initialSyncedAt]);

  const storeOrders = useActiveHomeOrders();
  const orders = mounted ? storeOrders : initialOrders.map(toHomeOrder);
  const seenRef = useRef<Set<string> | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);

  const pollOrders = useCallback(async (options?: { full?: boolean }) => {
    if (document.visibilityState !== "visible") {
      return;
    }
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    try {
      const params = new URLSearchParams({ scope: "active" });
      const wantFull = options?.full === true;
      if (wantFull) {
        params.set("full", "1");
      } else if (syncedAtRef.current) {
        params.set("since", syncedAtRef.current);
      } else {
        params.set("full", "1");
      }

      const response = await fetch(`/api/merchant/orders?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as ActivePollResponse;
      if (typeof data.syncedAt === "string" && data.syncedAt) {
        syncedAtRef.current = data.syncedAt;
      }
      if (!Array.isArray(data.orders)) {
        return;
      }
      if (data.mode === "delta") {
        applyActiveOrderDelta(data.orders);
      } else {
        syncActiveMerchantOrders(data.orders);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const fullRefresh = useCallback(async () => {
    routerRef.current.refresh();
    await pollOrders({ full: true });
  }, [pollOrders]);

  useEffect(() => {
    const ordersId = window.setInterval(() => {
      void pollOrders();
    }, ORDERS_POLL_MS);
    const fullId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void pollOrders({ full: true });
        routerRef.current.refresh();
      }
    }, FULL_SYNC_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      const hiddenFor = hiddenAt ? Date.now() - hiddenAt : 0;
      void pollOrders({
        full: hiddenFor >= FULL_SYNC_AFTER_HIDDEN_MS,
      });
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(ordersId);
      window.clearInterval(fullId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pollOrders]);

  const grouped = useMemo(() => {
    return SECTIONS.map((section) => ({
      ...section,
      orders: sortSection(
        section.id,
        orders.filter((order) => section.statuses.includes(order.order_status)),
      ),
    })).filter((section) => section.orders.length > 0);
  }, [orders]);

  useEffect(() => {
    const pendingIds = orders
      .filter((order) => order.order_status === "pending")
      .map((order) => order.id);

    if (seenRef.current === null) {
      seenRef.current = new Set(pendingIds);
      return;
    }

    const newcomers = pendingIds.filter((id) => !seenRef.current?.has(id));
    if (newcomers.length > 0) {
      setHighlightIds((current) => [...new Set([...current, ...newcomers])]);
      playOrderAlert(newcomers.length);
    }
    seenRef.current = new Set(pendingIds);
  }, [orders]);

  const highlight = new Set(
    highlightIds.filter((id) =>
      orders.some((order) => order.id === id && order.order_status === "pending"),
    ),
  );

  const waiting = orders.filter((order) => order.order_status === "pending").length;
  const cooking = orders.filter(
    (order) =>
      order.order_status === "accepted" || order.order_status === "preparing",
  ).length;
  const ready = orders.filter((order) => order.order_status === "ready").length;

  return (
    <PullToRefresh onRefresh={fullRefresh}>
      <section className="flex flex-col gap-4">
        <OrderAlertsPrompt />
        {waiting > 0 || cooking > 0 || ready > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            <MetaPill label="New" value={waiting} tone="accent" />
            <MetaPill label="Cooking" value={cooking} tone="amber" />
            <MetaPill label="Ready" value={ready} tone="blue" />
          </div>
        ) : null}

        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center">
            <p className="text-lg font-semibold">All caught up</p>
            <p className="mt-1 text-sm text-muted">
              No orders need attention. Pull down to refresh.
            </p>
          </div>
        ) : (
          grouped.map((section) => (
            <div key={section.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
                  {section.title}
                </h2>
                <span className="text-xs font-semibold text-accent">
                  {section.orders.length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {section.orders.map((order) => (
                  <HomeOrderCard
                    key={order.id}
                    order={order}
                    highlight={highlight.has(order.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        <HomeStoreFooter
          storeName={storeName}
          slug={slug}
          isOpen={isOpen}
          description={description}
        />
      </section>
    </PullToRefresh>
  );
}

function MetaPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "amber" | "blue";
}) {
  const shell =
    tone === "accent"
      ? "border-accent/40 bg-accent/10 text-accent"
      : tone === "amber"
        ? "border-[#b9892d]/40 bg-[#b9892d]/10 text-[#8a6420]"
        : "border-[#2f6fed]/40 bg-[#2f6fed]/10 text-[#1d4fbe]";

  return (
    <div className={`rounded-2xl border px-3 py-2.5 text-center ${shell}`}>
      <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-semibold tracking-wide uppercase opacity-80">
        {label}
      </p>
    </div>
  );
}

function sortSection(id: string, orders: HomeOrder[]) {
  const copy = [...orders];
  copy.sort((a, b) => {
    const delta =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return id === "new" ? -delta : delta;
  });
  return copy;
}
