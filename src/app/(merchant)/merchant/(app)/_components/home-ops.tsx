"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HomeOrder } from "@/lib/orders/home-order";
import type { OrderStatus } from "@/lib/types/database";
import { HomeHeader } from "./home-header";
import { HomeOrderCard } from "./home-order-card";
import { PullToRefresh } from "./pull-to-refresh";
import { TodaySummary } from "./today-summary";

const ORDERS_POLL_MS = 30 * 1000;
const FULL_REFRESH_MS = 5 * 60 * 1000;

const SECTIONS: { id: string; title: string; statuses: OrderStatus[] }[] = [
  { id: "new", title: "New", statuses: ["pending"] },
  { id: "accepted", title: "Accepted", statuses: ["accepted"] },
  { id: "preparing", title: "Preparing", statuses: ["preparing"] },
  { id: "ready", title: "Ready", statuses: ["ready"] },
];

export function HomeOps({
  storeName,
  isOpen,
  todayCount,
  todaySales,
  newCustomersToday,
  orders: initialOrders,
}: {
  storeName: string;
  isOpen: boolean;
  todayCount: number;
  todaySales: number;
  newCustomersToday: number;
  orders: HomeOrder[];
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [orders, setOrders] = useState(initialOrders);
  const seenRef = useRef<Set<string> | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const pollOrders = useCallback(async () => {
    if (document.visibilityState !== "visible") {
      return;
    }
    const response = await fetch("/api/merchant/orders?scope=active", {
      credentials: "include",
    });
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { orders?: HomeOrder[] };
    if (Array.isArray(data.orders)) {
      setOrders(data.orders);
    }
  }, []);

  const fullRefresh = useCallback(async () => {
    routerRef.current.refresh();
    await pollOrders();
  }, [pollOrders]);

  useEffect(() => {
    const ordersId = window.setInterval(() => {
      void pollOrders();
    }, ORDERS_POLL_MS);
    const fullId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        routerRef.current.refresh();
      }
    }, FULL_REFRESH_MS);
    return () => {
      window.clearInterval(ordersId);
      window.clearInterval(fullId);
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
      playAlert(newcomers.length);
    }
    seenRef.current = new Set(pendingIds);
  }, [orders]);

  const highlight = new Set(
    highlightIds.filter((id) =>
      orders.some((order) => order.id === id && order.order_status === "pending"),
    ),
  );
  const livePending = orders.filter(
    (order) => order.order_status === "pending",
  ).length;

  return (
    <PullToRefresh onRefresh={fullRefresh}>
      <section className="flex flex-col gap-4">
        <HomeHeader
          storeName={storeName}
          isOpen={isOpen}
          pendingCount={livePending}
        />
        <TodaySummary
          todayCount={todayCount}
          todaySales={todaySales}
          pendingCount={livePending}
          newCustomersToday={newCustomersToday}
          isOpen={isOpen}
        />

        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center">
            <p className="text-lg font-semibold">All caught up</p>
            <p className="mt-1 text-sm text-muted">
              {isOpen
                ? "No orders need attention. Pull down to refresh."
                : "Store is closed. Open it when you are ready for orders."}
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
      </section>
    </PullToRefresh>
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

function playAlert(count: number) {
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.18);
    void audio.resume();
  } catch {
    // Sound can fail until the merchant taps the page.
  }

  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  try {
    new Notification(count === 1 ? "New order" : `${count} new orders`, {
      body: "A customer is waiting. Open FoodBaba to accept.",
    });
  } catch {
    // Ignore blocked notifications.
  }
}
