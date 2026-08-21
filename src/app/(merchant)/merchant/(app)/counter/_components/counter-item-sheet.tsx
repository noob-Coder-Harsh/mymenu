"use client";

import { useMemo } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { formatInr } from "@/lib/money";
import { hasMultiplePrices, type MenuItemView } from "@/lib/menu/types";

const MAX_QTY = 20;

export function CounterItemSheet({
  item,
  qty,
  onChangeQty,
  onClose,
  onDone,
}: {
  item: MenuItemView;
  qty: Record<string, number>;
  onChangeQty: (variantId: string, quantity: number) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const sellable = useMemo(
    () => item.variants.filter((variant) => variant.is_available),
    [item.variants],
  );
  const multi = hasMultiplePrices(item) && sellable.length > 1;
  const variants = multi ? sellable : sellable.slice(0, 1);
  const selectedCount = variants.reduce(
    (sum, variant) => sum + (qty[variant.id] ?? 0),
    0,
  );

  return (
    <BottomSheet open title={item.name} onClose={onClose}>
      {item.description ? (
        <p className="mb-4 text-sm leading-6 text-muted">{item.description}</p>
      ) : null}

      {!item.is_available || variants.length === 0 ? (
        <p className="rounded-2xl bg-background px-4 py-3 text-sm text-muted">
          Sold out right now.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm text-muted">
            {multi ? "Tap a size to add" : "Tap to add"}
          </p>
          <div className="flex flex-col gap-2">
            {variants.map((variant) => {
              const quantity = qty[variant.id] ?? 0;
              return (
                <div
                  key={variant.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    onChangeQty(variant.id, Math.min(MAX_QTY, quantity + 1))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onChangeQty(variant.id, Math.min(MAX_QTY, quantity + 1));
                    }
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {variant.name.trim() || "Regular"}
                    </p>
                    <p className="text-sm font-bold tabular-nums text-accent">
                      {formatInr(variant.price)}
                    </p>
                  </div>
                  <div
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <CompactStepper
                      quantity={quantity}
                      onChange={(next) => onChangeQty(variant.id, next)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-accent text-base font-semibold text-accent-foreground"
      >
        {selectedCount > 0 ? `Done · ×${selectedCount}` : "Done"}
      </button>
    </BottomSheet>
  );
}

function CompactStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (next: number) => void;
}) {
  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(1)}
        className="h-8 rounded-full bg-accent px-3 text-xs font-semibold text-accent-foreground"
      >
        Add
      </button>
    );
  }

  return (
    <div className="flex h-8 items-center rounded-full bg-accent text-accent-foreground">
      <button
        type="button"
        className="px-2.5 text-base leading-none"
        onClick={() => onChange(quantity - 1)}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="min-w-4 text-center text-xs font-semibold">{quantity}</span>
      <button
        type="button"
        className="px-2.5 text-base leading-none"
        onClick={() => onChange(Math.min(MAX_QTY, quantity + 1))}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
