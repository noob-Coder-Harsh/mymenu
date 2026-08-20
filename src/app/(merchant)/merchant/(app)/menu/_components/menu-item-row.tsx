"use client";

import { formatInr } from "@/lib/money";
import { displayPrice, hasMultiplePrices } from "@/lib/menu/types";
import type { MenuItemView } from "@/lib/menu/types";
import { AvailabilityToggle } from "./availability-toggle";

export function MenuItemRow({
  item,
  onEdit,
}: {
  item: MenuItemView;
  onEdit: (item: MenuItemView) => void;
}) {
  const price = displayPrice(item);
  const multi = hasMultiplePrices(item);
  const priceLabel =
    price === null
      ? "No price"
      : multi
        ? `from ${formatInr(price)}`
        : formatInr(price);

  return (
    <article className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex gap-3">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background text-[10px] text-muted">
            No pic
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm font-semibold leading-5">{item.name}</p>
              <p className="mt-0.5 text-sm font-semibold text-accent">{priceLabel}</p>
            </button>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted"
            >
              Edit
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {multi ? (
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
                {item.variants.length} prices
              </span>
            ) : null}
            {!item.is_active ? (
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
                Hidden
              </span>
            ) : null}
            <AvailabilityToggle itemId={item.id} isAvailable={item.is_available} />
          </div>
        </div>
      </div>
    </article>
  );
}
