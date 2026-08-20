import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parsePrice } from "@/lib/money";
import type { MenuCategory, MenuItem, MenuItemVariant } from "@/lib/types/database";
import type { MenuItemView, MenuItemVariantView } from "@/lib/menu/types";

export type { MenuItemView } from "@/lib/menu/types";
export {
  displayPrice,
  formatOrderItemName,
  hasMultiplePrices,
} from "@/lib/menu/types";

export async function getStoreMenu(storeId: string) {
  const supabase = getSupabaseAdmin();
  const [{ data: categories, error: categoryError }, { data: items, error: itemError }] =
    await Promise.all([
      supabase
        .from("menu_categories")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("menu_items")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  if (categoryError) {
    throw categoryError;
  }
  if (itemError) {
    throw itemError;
  }

  const menuItems = (items ?? []) as MenuItem[];
  const itemIds = menuItems.map((item) => item.id);

  let variantsByItem = new Map<string, MenuItemVariantView[]>();
  if (itemIds.length > 0) {
    const { data: variants, error: variantError } = await supabase
      .from("menu_item_variants")
      .select("*")
      .in("menu_item_id", itemIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (variantError) {
      throw variantError;
    }

    variantsByItem = groupVariants((variants ?? []) as MenuItemVariant[]);
  }

  return {
    categories: (categories ?? []) as MenuCategory[],
    items: menuItems.map((item) =>
      normalizeMenuItem(item, variantsByItem.get(item.id) ?? []),
    ),
  };
}

function groupVariants(variants: MenuItemVariant[]) {
  const map = new Map<string, MenuItemVariantView[]>();
  for (const variant of variants) {
    const list = map.get(variant.menu_item_id) ?? [];
    list.push(normalizeVariant(variant));
    map.set(variant.menu_item_id, list);
  }
  return map;
}

export function normalizeVariant(variant: MenuItemVariant): MenuItemVariantView {
  return {
    ...variant,
    name: variant.name ?? "",
    price: parsePrice(variant.price) ?? 0,
  };
}

export function normalizeMenuItem(
  item: MenuItem,
  variants: MenuItemVariantView[],
): MenuItemView {
  return {
    ...item,
    variants,
  };
}

export async function nextSortOrder(
  table: "menu_categories" | "menu_items",
  storeId: string,
) {
  const supabase = getSupabaseAdmin();
  if (table === "menu_categories") {
    const { data } = await supabase
      .from("menu_categories")
      .select("sort_order")
      .eq("store_id", storeId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.sort_order ?? -1) + 1;
  }

  const { data } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}
