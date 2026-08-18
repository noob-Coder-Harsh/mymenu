import type { MenuItemView } from "@/lib/menu/types";
import type { CartLine } from "@/lib/cart/types";

export type CartEntry = {
  item: MenuItemView;
  quantity: number;
  lineTotal: number;
};

export type UnavailableCartLine = {
  menuItemId: string;
  quantity: number;
  item: MenuItemView | null;
};

export function buildCartEntries(lines: CartLine[], items: MenuItemView[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const available: CartEntry[] = [];
  const unavailable: UnavailableCartLine[] = [];

  for (const line of lines) {
    const item = byId.get(line.menuItemId);
    if (!item || !item.is_available) {
      unavailable.push({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        item: item ?? null,
      });
      continue;
    }
    available.push({
      item,
      quantity: line.quantity,
      lineTotal: Math.round(item.price * line.quantity * 100) / 100,
    });
  }

  const subtotal = Math.round(available.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
  const itemCount = available.reduce((sum, line) => sum + line.quantity, 0);

  return {
    available,
    unavailable,
    missing: unavailable.length,
    subtotal,
    itemCount,
  };
}
