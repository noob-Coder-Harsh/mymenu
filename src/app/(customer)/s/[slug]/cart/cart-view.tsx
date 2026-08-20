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
    return <p className="font-script text-base text-muted">Loading cart…</p>;
  }

  if (itemCount === 0 && unavailable.length === 0) {
    return (
      <div className="customer-card flex flex-col gap-3 px-4 py-8 text-center">
        <p className="font-script text-lg text-muted">
          {storeOpen ? "Your cart is empty." : "This store is closed. Checkout is paused."}
        </p>
        <Link href={`/s/${slug}`} className="customer-link">
          Browse menu
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {unavailable.length > 0 ? (
        <p className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {unavailable.length} {unavailable.length === 1 ? "item is" : "items are"} no longer
          available and cannot be checked out.
        </p>
      ) : null}

      {!storeOpen ? (
        <p className="customer-card px-4 py-3 text-sm text-muted">
          This store is closed. You can review your cart, but you cannot check out yet.
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {available.map((line) => (
          <div key={line.variant.id} className="customer-card flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold tracking-tight">{line.label}</p>
              <p className="mt-0.5 text-sm text-muted">
                {formatInr(line.variant.price)}
                <span className="font-script text-muted"> × {line.quantity}</span>
              </p>
            </div>
            <p className="text-sm font-bold tabular-nums">{formatInr(line.lineTotal)}</p>
            <QuantityStepper
              variantId={line.variant.id}
              available={line.item.is_available && line.variant.is_available}
              disabled={!storeOpen}
              compact
            />
          </div>
        ))}
        {unavailable.map((line) => (
          <div
            key={line.variantId}
            className="customer-card flex items-center gap-3 p-3 opacity-70"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold tracking-tight">
                {line.item && line.variant
                  ? line.variant.name.trim()
                    ? `${line.item.name} · ${line.variant.name}`
                    : line.item.name
                  : "Unavailable item"}
              </p>
              <p className="mt-0.5 text-sm text-danger">Sold out or removed from the menu</p>
            </div>
            <button
              type="button"
              onClick={() => setQuantity(line.variantId, 0)}
              className="customer-link"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {itemCount > 0 ? (
        <>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Less spicy, extra napkins…"
              className="customer-input px-4 py-3 text-base font-normal"
            />
          </label>

          <div className="customer-card flex items-center justify-between px-4 py-3 text-base font-bold">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatInr(subtotal)}</span>
          </div>
        </>
      ) : null}

      {storeOpen && itemCount > 0 ? (
        <Link href={`/s/${slug}/checkout`} className="customer-btn">
          Proceed to checkout
        </Link>
      ) : null}

      {!storeOpen && itemCount > 0 ? (
        <p className="font-script text-center text-base text-muted">
          Checkout is available when the store opens.
        </p>
      ) : null}

      {itemCount === 0 ? (
        <Link href={`/s/${slug}`} className="customer-link text-center">
          Browse menu
        </Link>
      ) : null}
    </div>
  );
}
