"use client";

import Link from "next/link";
import { formatInr } from "@/lib/money";
import { buildCartEntries } from "@/lib/cart/summary";
import type { MenuItemView } from "@/lib/menu/types";
import { useCart } from "./cart-provider";

export function CartBar({
  slug,
  items,
  storeOpen,
}: {
  slug: string;
  items: MenuItemView[];
  storeOpen: boolean;
}) {
  const { lines, ready } = useCart();
  const { itemCount, subtotal } = buildCartEntries(lines, items);

  if (!ready || itemCount === 0 || !storeOpen) {
    return null;
  }

  return (
    <div className="mt-auto sticky bottom-0 z-10 bg-gradient-to-t from-background from-70% to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <Link
        href={`/s/${slug}/cart`}
        className="flex h-12 items-center justify-between rounded-2xl bg-accent px-4 text-sm font-medium text-accent-foreground shadow-lg"
      >
        <span>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span>{formatInr(subtotal)} · View cart</span>
      </Link>
    </div>
  );
}
