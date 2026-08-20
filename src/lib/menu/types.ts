import type { MenuItem, MenuItemVariant } from "@/lib/types/database";

export type MenuItemVariantView = Omit<MenuItemVariant, "price"> & {
  price: number;
};

export type MenuItemView = MenuItem & {
  variants: MenuItemVariantView[];
};

/** Lowest available price for list display; falls back to any variant. */
export function displayPrice(item: MenuItemView): number | null {
  const available = item.variants.filter((v) => v.is_available);
  const pool = available.length > 0 ? available : item.variants;
  if (pool.length === 0) {
    return null;
  }
  return Math.min(...pool.map((v) => v.price));
}

export function hasMultiplePrices(item: MenuItemView): boolean {
  return item.variants.length > 1;
}

export function formatOrderItemName(itemName: string, variantName: string) {
  const size = variantName.trim();
  return size ? `${itemName} · ${size}` : itemName;
}
