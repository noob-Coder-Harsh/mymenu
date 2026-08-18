"use client";

import Link from "next/link";
import { formatInr } from "@/lib/money";
import { buildCartEntries } from "@/lib/cart/summary";
import type { MenuItemView } from "@/lib/menu/types";
import { useCart } from "../_components/cart-provider";
import { QuantityStepper } from "../_components/quantity-stepper";

export function CartView({
  slug,
  items,
  storeOpen,
}: {
  slug: string;
  items: MenuItemView[];
  storeOpen: boolean;
}) {
  const { lines, notes, setNotes, setQuantity, ready } = useCart();
  const { available, unavailable, subtotal, itemCount } = buildCartEntries(lines, items);

  if (!ready) {
    return <p className="text-sm text-muted">Loading cart…</p>;
  }

  if (itemCount === 0 && unavailable.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          {storeOpen ? "Your cart is empty." : "This store is closed. Checkout is paused."}
        </p>
        <Link href={`/s/${slug}`} className="text-sm font-medium text-accent">
          Browse menu
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {unavailable.length > 0 ? (
        <p className="text-sm text-danger">
          {unavailable.length} {unavailable.length === 1 ? "item is" : "items are"} no longer
          available and cannot be checked out.
        </p>
      ) : null}

      {!storeOpen ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          This store is closed. You can review your cart, but you cannot check out yet.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {available.map((line) => (
          <div
            key={line.item.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{line.item.name}</p>
              <p className="text-sm text-muted">
                {formatInr(line.item.price)} × {line.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold">{formatInr(line.lineTotal)}</p>
            <QuantityStepper item={line.item} disabled={!storeOpen} />
          </div>
        ))}
        {unavailable.map((line) => (
          <div
            key={line.menuItemId}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 opacity-70"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{line.item?.name ?? "Unavailable item"}</p>
              <p className="text-sm text-danger">Sold out or removed from the menu</p>
            </div>
            <button
              type="button"
              onClick={() => setQuantity(line.menuItemId, 0)}
              className="text-sm font-medium text-accent"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {itemCount > 0 ? (
        <>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Less spicy, extra napkins…"
              className="rounded-2xl border border-border bg-surface px-4 py-3 text-base font-normal outline-none focus:border-accent"
            />
          </label>

          <div className="flex items-center justify-between text-base font-semibold">
            <span>Subtotal</span>
            <span>{formatInr(subtotal)}</span>
          </div>
        </>
      ) : null}

      {storeOpen && itemCount > 0 ? (
        <Link
          href={`/s/${slug}/checkout`}
          className="flex h-12 items-center justify-center rounded-2xl bg-accent text-base font-medium text-accent-foreground"
        >
          Proceed to checkout
        </Link>
      ) : null}

      {!storeOpen && itemCount > 0 ? (
        <p className="text-center text-sm text-muted">Checkout is available when the store opens.</p>
      ) : null}

      {itemCount === 0 ? (
        <Link href={`/s/${slug}`} className="text-sm font-medium text-accent">
          Browse menu
        </Link>
      ) : null}
    </div>
  );
}
