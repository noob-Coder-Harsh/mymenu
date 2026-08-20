"use client";

import { useCart } from "./cart-provider";

export function QuantityStepper({
  variantId,
  available = true,
  disabled,
  compact = false,
}: {
  variantId: string;
  available?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { quantityFor, setQuantity, add } = useCart();
  const quantity = quantityFor(variantId);

  if (!available) {
    return (
      <span
        className={`rounded-full bg-background px-2.5 py-1 font-medium text-muted ${
          compact ? "text-[11px]" : "text-xs"
        }`}
      >
        Sold out
      </span>
    );
  }

  if (disabled) {
    return (
      <span
        className={`rounded-full bg-background px-2.5 py-1 font-medium text-muted ${
          compact ? "text-[11px]" : "text-xs"
        }`}
      >
        Closed
      </span>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => add(variantId)}
        className={`rounded-full bg-accent font-medium text-accent-foreground ${
          compact ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm"
        }`}
      >
        Add
      </button>
    );
  }

  return (
    <div
      className={`flex items-center rounded-full bg-accent text-accent-foreground ${
        compact ? "h-8" : "h-9"
      }`}
    >
      <button
        type="button"
        className={`leading-none ${compact ? "px-2.5 text-base" : "px-3 text-lg"}`}
        onClick={() => setQuantity(variantId, quantity - 1)}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span
        className={`min-w-4 text-center font-semibold ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {quantity}
      </span>
      <button
        type="button"
        className={`leading-none ${compact ? "px-2.5 text-base" : "px-3 text-lg"}`}
        onClick={() => setQuantity(variantId, quantity + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
