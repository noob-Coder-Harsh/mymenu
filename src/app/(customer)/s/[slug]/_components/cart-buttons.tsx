"use client";

import Link from "next/link";
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

export function FloatingCartButton({
  slug,
  storeOpen,
}: {
  slug: string;
  storeOpen: boolean;
}) {
  const { itemCount, ready } = useCart();

  if (!ready || itemCount === 0 || !storeOpen) {
    return null;
  }

  return (
    <Link
      href={`/s/${slug}/cart`}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/35"
      aria-label={`View cart, ${itemCount} items`}
    >
      <CartIcon className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-accent-foreground">
        {itemCount > 99 ? "99+" : itemCount}
      </span>
    </Link>
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
