"use client";

import { useEffect } from "react";
import { formatInr } from "@/lib/money";
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
          <p className="text-base font-semibold">{formatInr(item.price)}</p>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <QuantityStepper item={item} disabled={!storeOpen} />
          <button type="button" onClick={onClose} className="text-sm font-medium text-muted">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
