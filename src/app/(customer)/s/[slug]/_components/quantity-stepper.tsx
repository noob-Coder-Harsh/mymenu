"use client";

import { useCart } from "./cart-provider";

export function QuantityStepper({
  variantId,
  available = true,
  disabled,
}: {
  variantId: string;
  available?: boolean;
  disabled?: boolean;
}) {
  const { quantityFor, setQuantity, add } = useCart();
  const quantity = quantityFor(variantId);

  if (!available) {
    return (
      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
        Sold out
      </span>
    );
  }

  if (disabled) {
    return (
      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
        Closed
      </span>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => add(variantId)}
        className="h-9 rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground"
      >
        Add
      </button>
    );
  }

  return (
    <div className="flex h-9 items-center rounded-full bg-accent text-accent-foreground">
      <button
        type="button"
        className="px-3 text-lg leading-none"
        onClick={() => setQuantity(variantId, quantity - 1)}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-4 text-center text-sm font-semibold">{quantity}</span>
      <button
        type="button"
        className="px-3 text-lg leading-none"
        onClick={() => setQuantity(variantId, quantity + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
