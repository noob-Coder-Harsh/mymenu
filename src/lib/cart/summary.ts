import {
  formatOrderItemName,
  type MenuItemVariantView,
  type MenuItemView,
} from "@/lib/menu/types";
import type { CartLine } from "@/lib/cart/types";

export type CartEntry = {
  item: MenuItemView;
  variant: MenuItemVariantView;
  label: string;
  quantity: number;
  lineTotal: number;
};

export type UnavailableCartLine = {
  variantId: string;
  quantity: number;
  item: MenuItemView | null;
  variant: MenuItemVariantView | null;
};

function indexCatalog(items: MenuItemView[]) {
  const byVariantId = new Map<
    string,
    { item: MenuItemView; variant: MenuItemVariantView }
  >();
  for (const item of items) {
    for (const variant of item.variants) {
      byVariantId.set(variant.id, { item, variant });
    }
  }
  return byVariantId;
}

export function buildCartEntries(lines: CartLine[], items: MenuItemView[]) {
  const byVariantId = indexCatalog(items);
  const available: CartEntry[] = [];
  const unavailable: UnavailableCartLine[] = [];

  for (const line of lines) {
    const match = byVariantId.get(line.variantId);
    if (
      !match ||
      !match.item.is_available ||
      !match.item.is_active ||
      !match.variant.is_available
    ) {
      unavailable.push({
        variantId: line.variantId,
        quantity: line.quantity,
        item: match?.item ?? null,
        variant: match?.variant ?? null,
      });
      continue;
    }
    const { item, variant } = match;
    available.push({
      item,
      variant,
      label: formatOrderItemName(item.name, variant.name),
      quantity: line.quantity,
      lineTotal: Math.round(variant.price * line.quantity * 100) / 100,
    });
  }

  const subtotal =
    Math.round(available.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
  const itemCount = available.reduce((sum, line) => sum + line.quantity, 0);

  return {
    available,
    unavailable,
    missing: unavailable.length,
    subtotal,
    itemCount,
  };
}
