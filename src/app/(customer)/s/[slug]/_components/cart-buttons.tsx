"use client";

import Link from "next/link";
import { formatInr } from "@/lib/money";
import { buildCartEntries } from "@/lib/cart/summary";
import type { MenuItemView } from "@/lib/menu/types";
import { useCart } from "./cart-provider";

export function HeaderCartButton({ slug }: { slug: string }) {
  const { itemCount, ready } = useCart();

  return (
    <Link
      href={`/s/${slug}/cart`}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[#fffefb] text-foreground shadow-[0_1px_0_rgba(44,24,16,0.04)]"
      aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : "Cart"}
    >
      <CartIcon className="h-5 w-5" />
      {ready && itemCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}

export function CheckoutBar({
  slug,
  storeOpen,
  items,
}: {
  slug: string;
  storeOpen: boolean;
  items: MenuItemView[];
}) {
  const { lines, itemCount, ready } = useCart();
  const { subtotal } = buildCartEntries(lines, items);

  if (!ready || itemCount === 0 || !storeOpen) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
      <div className="mx-auto w-full max-w-md px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Link
          href={`/s/${slug}/checkout`}
          className="customer-btn pointer-events-auto w-full shadow-lg shadow-accent/30"
          aria-label={`Proceed to checkout, ${itemCount} items, ${formatInr(subtotal)}`}
        >
          <span className="flex w-full items-center justify-between gap-3 px-1">
            <span className="truncate">Proceed to checkout</span>
            <span className="shrink-0 tabular-nums">
              {itemCount} · {formatInr(subtotal)}
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
