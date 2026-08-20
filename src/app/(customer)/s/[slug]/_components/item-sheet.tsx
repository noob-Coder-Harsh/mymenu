"use client";

import { useMemo } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { formatInr } from "@/lib/money";
import { hasMultiplePrices, type MenuItemView } from "@/lib/menu/types";
import { QuantityStepper } from "./quantity-stepper";

export function ItemSheet({
  item,
  storeOpen,
  onClose,
}: {
  item: MenuItemView;
  storeOpen: boolean;
  onClose: () => void;
}) {
  const sellable = useMemo(
    () => item.variants.filter((variant) => variant.is_available),
    [item.variants],
  );
  const multi = hasMultiplePrices(item) && sellable.length > 1;
  const variants = multi ? sellable : sellable.slice(0, 1);

  return (
    <BottomSheet open title={item.name} onClose={onClose}>
      {item.description ? (
        <p className="font-script mb-4 text-[17px] leading-6 text-muted">
          {item.description}
        </p>
      ) : null}

      {!item.is_available || variants.length === 0 ? (
        <p className="rounded-2xl bg-background px-4 py-3 text-sm text-muted">
          Sold out right now.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="font-script text-[15px] text-muted">
            {multi ? "Pick sizes — add as many as you like" : "Add to cart"}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="flex min-w-[calc(50%-0.25rem)] flex-1 items-center gap-2 rounded-2xl border border-border bg-[#fffefb] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {variant.name.trim() || "Regular"}
                  </p>
                  <p className="text-sm font-bold tabular-nums text-accent">
                    {formatInr(variant.price)}
                  </p>
                </div>
                <QuantityStepper
                  variantId={variant.id}
                  available={item.is_available && variant.is_available}
                  disabled={!storeOpen}
                  compact
                />
              </div>
            ))}
          </div>
          {!storeOpen ? (
            <p className="pt-1 text-sm text-muted">
              Store is closed — browsing only for now.
            </p>
          ) : null}
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-accent text-base font-semibold text-accent-foreground"
      >
        Done
      </button>
    </BottomSheet>
  );
}
