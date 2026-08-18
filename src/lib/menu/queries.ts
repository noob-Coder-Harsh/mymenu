import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parsePrice } from "@/lib/money";
import type { MenuCategory, MenuItem } from "@/lib/types/database";
import type { MenuItemView } from "@/lib/menu/types";

export type { MenuItemView } from "@/lib/menu/types";

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

  return {
    categories: (categories ?? []) as MenuCategory[],
    items: ((items ?? []) as MenuItem[]).map(normalizeMenuItem),
  };
}

export function normalizeMenuItem(item: MenuItem): MenuItemView {
  return {
    ...item,
    price: parsePrice(item.price) ?? 0,
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
