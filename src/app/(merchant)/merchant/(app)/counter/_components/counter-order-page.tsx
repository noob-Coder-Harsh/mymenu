"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatInr } from "@/lib/money";
import {
  displayPrice,
  formatOrderItemName,
  hasMultiplePrices,
  type MenuItemView,
} from "@/lib/menu/types";
import { addLocalActiveMerchantOrder } from "@/lib/orders/merchant-order-store";
import { withItems } from "@/lib/orders/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/types/labels";
import type {
  MenuCategory,
  Order,
  OrderItem,
  PaymentMethod,
} from "@/lib/types/database";
import { TakeawayToggle } from "@/components/ui/takeaway-toggle";
import { CounterItemSheet } from "./counter-item-sheet";

type Step = "pick" | "checkout";
type QtyMap = Record<string, number>;

type LineView = {
  variantId: string;
  label: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

const MAX_QTY = 20;

export function CounterOrderPage({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItemView[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [qty, setQty] = useState<QtyMap>({});
  const [selected, setSelected] = useState<MenuItemView | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.is_active),
    [categories],
  );

  const sellableItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.is_active &&
          item.is_available &&
          item.variants.some((variant) => variant.is_available),
      ),
    [items],
  );

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sellableItems.filter((item) => {
      if (categoryId !== "all" && item.category_id !== categoryId) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return item.name.toLowerCase().includes(needle);
    });
  }, [sellableItems, categoryId, query]);

  const lines = useMemo(() => {
    const result: LineView[] = [];
    for (const item of sellableItems) {
      for (const variant of item.variants) {
        if (!variant.is_available) {
          continue;
        }
        const quantity = qty[variant.id] ?? 0;
        if (quantity < 1) {
          continue;
        }
        result.push({
          variantId: variant.id,
          label: formatOrderItemName(item.name, variant.name),
          unitPrice: variant.price,
          quantity,
          lineTotal: Math.round(variant.price * quantity * 100) / 100,
        });
      }
    }
    return result;
  }, [sellableItems, qty]);

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total =
    Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;

  function setVariantQty(variantId: string, next: number) {
    setQty((current) => {
      const clamped = Math.max(0, Math.min(MAX_QTY, next));
      if (clamped === 0) {
        const copy = { ...current };
        delete copy[variantId];
        return copy;
      }
      return { ...current, [variantId]: clamped };
    });
  }

  function quantityForItem(item: MenuItemView) {
    return item.variants.reduce(
      (sum, variant) => sum + (qty[variant.id] ?? 0),
      0,
    );
  }

  async function createOrder() {
    if (lines.length === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/merchant/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
          is_takeaway: isTakeaway,
          items: lines.map((line) => ({
            menu_item_variant_id: line.variantId,
            quantity: line.quantity,
          })),
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        order?: Order;
        items?: OrderItem[];
      };
      if (!response.ok || !data.order || !data.items) {
        throw new Error(data.error || "Could not create order");
      }
      addLocalActiveMerchantOrder(withItems(data.order, data.items));
      router.replace("/merchant");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not create order",
      );
      setSubmitting(false);
    }
  }

  if (step === "checkout") {
    return (
      <section className="flex flex-col gap-5 pb-8">
        <header>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("pick");
            }}
            className="text-sm font-medium text-accent"
          >
            ← Items
          </button>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Checkout</h1>
        </header>

        <ul className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
          {lines.map((line) => (
            <li
              key={line.variantId}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span className="min-w-0 font-medium">
                {line.quantity} × {line.label}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatInr(line.lineTotal)}
              </span>
            </li>
          ))}
          <li className="mt-2 flex items-center justify-between border-t border-border pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-base font-bold tabular-nums">
              {formatInr(total)}
            </span>
          </li>
        </ul>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Takeaway
          </p>
          <TakeawayToggle value={isTakeaway} onChange={setIsTakeaway} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Payment
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["cash", "upi"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`flex h-11 items-center justify-center rounded-2xl border text-sm font-semibold ${
                  paymentMethod === method
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted"
                }`}
              >
                {PAYMENT_METHOD_LABELS[method]}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface px-4 pt-3 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="mx-auto w-full max-w-3xl">
            <button
              type="button"
              disabled={submitting || itemCount === 0}
              onClick={() => void createOrder()}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-accent text-base font-semibold text-accent-foreground disabled:opacity-50"
            >
              {submitting ? "Placing…" : `Place order · ${formatInr(total)}`}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">New order</h1>
          <p className="text-sm text-muted">Tap items to add</p>
        </div>
      </header>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search items"
        className="h-11 w-full rounded-2xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-accent"
      />

      {activeCategories.length > 0 ? (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          <CategoryChip
            label="All"
            active={categoryId === "all"}
            onClick={() => setCategoryId("all")}
          />
          {activeCategories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              active={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
            />
          ))}
        </div>
      ) : null}

      {sellableItems.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
          No available menu items yet. Add items in Menu first.
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No matching items</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {filteredItems.map((item) => {
            const count = quantityForItem(item);
            const price = displayPrice(item);
            const multi =
              hasMultiplePrices(item) &&
              item.variants.filter((variant) => variant.is_available).length > 1;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">
                      {price != null ? formatInr(price) : "—"}
                      {multi ? " · sizes" : ""}
                    </p>
                  </div>
                  {count > 0 ? (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                      ×{count}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-accent">Add</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <CounterItemSheet
          item={selected}
          qty={qty}
          onChangeQty={setVariantQty}
          onClose={() => setSelected(null)}
          onDone={() => {
            const current = quantityForItem(selected);
            setSelected(null);
            if (current > 0 || itemCount > 0) {
              setError(null);
              setStep("checkout");
            }
          }}
        />
      ) : null}
    </section>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
        active
          ? "bg-accent text-accent-foreground"
          : "border border-border bg-surface text-muted"
      }`}
    >
      {label}
    </button>
  );
}
