"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInr } from "@/lib/money";
import { displayPrice, hasMultiplePrices } from "@/lib/menu/types";
import type { MenuItemView } from "@/lib/menu/types";
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
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => sellable[0]?.id ?? item.variants[0]?.id ?? "",
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const selected =
    sellable.find((variant) => variant.id === selectedVariantId) ?? sellable[0] ?? null;
  const listPrice = displayPrice(item);

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close item details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-4 pb-8"
      >
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt=""
            className="mb-4 h-44 w-full rounded-2xl object-cover"
          />
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{item.name}</h2>
            {item.description ? (
              <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
            ) : null}
          </div>
          <p className="text-base font-semibold">
            {selected
              ? formatInr(selected.price)
              : listPrice !== null
                ? formatInr(listPrice)
                : "—"}
          </p>
        </div>

        {multi ? (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-sm font-medium">Choose size</p>
            <div className="flex flex-col gap-2">
              {sellable.map((variant) => {
                const active = variant.id === selected?.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`flex h-12 items-center justify-between rounded-2xl border px-4 text-sm ${
                      active
                        ? "border-accent bg-accent/10 font-medium"
                        : "border-border bg-background"
                    }`}
                  >
                    <span>{variant.name.trim() || "Regular"}</span>
                    <span>{formatInr(variant.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between">
          {selected ? (
            <QuantityStepper
              variantId={selected.id}
              available={item.is_available && selected.is_available}
              disabled={!storeOpen}
            />
          ) : (
            <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
              Sold out
            </span>
          )}
          <button type="button" onClick={onClose} className="text-sm font-medium text-muted">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
