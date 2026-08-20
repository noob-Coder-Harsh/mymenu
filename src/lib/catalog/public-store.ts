import "server-only";

import { cache } from "react";
import { getStoreMenu } from "@/lib/menu/queries";
import { parsePrice } from "@/lib/money";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { PublicCatalog } from "@/lib/catalog/types";
import type { Order, OrderItem } from "@/lib/types/database";

export const getPublicStoreBySlug = cache(async function getPublicStoreBySlug(
  slug: string,
): Promise<PublicCatalog | null> {
  const supabase = getSupabaseAdmin();
  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !store) {
    return null;
  }

  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", store.id)
    .maybeSingle();

  if (!settings) {
    return null;
  }

  const menu = await getStoreMenu(store.id);

  return {
    store,
    settings,
    categories: menu.categories.filter((category) => category.is_active),
    items: menu.items.filter(
      (item) =>
        item.is_active &&
        item.variants.some((variant) => variant.is_available),
    ),
  };
});

export async function getPublicOrder(storeId: string, orderId: string) {
  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error || !order) {
    return null;
  }

  const { data: items, error: itemError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  if (itemError) {
    throw itemError;
  }

  return {
    order: {
      ...order,
      subtotal: parsePrice(order.subtotal) ?? 0,
      total_amount: parsePrice(order.total_amount) ?? 0,
    } satisfies Order,
    items: ((items ?? []) as OrderItem[]).map((item) => ({
      ...item,
      unit_price: parsePrice(item.unit_price) ?? 0,
      total_amount: parsePrice(item.total_amount) ?? 0,
    })),
  };
}
