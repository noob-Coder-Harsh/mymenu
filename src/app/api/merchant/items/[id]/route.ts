import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { parsePriceRows } from "@/lib/menu/prices";
import { normalizeMenuItem, normalizeVariant } from "@/lib/menu/queries";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { MenuItem, MenuItemVariant } from "@/lib/types/database";

async function getOwnedItem(storeId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();
  return data as MenuItem | null;
}

async function loadItemWithVariants(storeId: string, id: string) {
  const item = await getOwnedItem(storeId, id);
  if (!item) {
    return null;
  }
  const supabase = getSupabaseAdmin();
  const { data: variants, error } = await supabase
    .from("menu_item_variants")
    .select("*")
    .eq("menu_item_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return normalizeMenuItem(
    item,
    ((variants ?? []) as MenuItemVariant[]).map(normalizeVariant),
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const { id } = await params;
  const existing = await getOwnedItem(auth.store.id, id);
  if (!existing) {
    return jsonError("Item not found", 404);
  }

  let body: {
    name?: string;
    description?: string | null;
    category_id?: string | null;
    prices?: unknown;
    is_available?: boolean;
    is_active?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const updates: {
    name?: string;
    description?: string | null;
    category_id?: string | null;
    is_available?: boolean;
    is_active?: boolean;
  } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) {
      return jsonError("Item name must be at least 2 characters", 400);
    }
    updates.name = name;
  }
  if ("description" in body) {
    updates.description = body.description?.trim() || null;
  }
  if ("category_id" in body) {
    const categoryId = body.category_id?.trim() || null;
    if (categoryId) {
      const supabase = getSupabaseAdmin();
      const { data: category } = await supabase
        .from("menu_categories")
        .select("id")
        .eq("id", categoryId)
        .eq("store_id", auth.store.id)
        .maybeSingle();
      if (!category) {
        return jsonError("Category not found", 400);
      }
    }
    updates.category_id = categoryId;
  }
  if (typeof body.is_available === "boolean") {
    updates.is_available = body.is_available;
  }
  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  const hasPrices = "prices" in body;
  let parsedPrices: ReturnType<typeof parsePriceRows> | null = null;
  if (hasPrices) {
    parsedPrices = parsePriceRows(body.prices);
    if (!parsedPrices.ok) {
      return jsonError(parsedPrices.message, 400);
    }
  }

  if (Object.keys(updates).length === 0 && !hasPrices) {
    return jsonError("No updates provided", 400);
  }

  const supabase = getSupabaseAdmin();

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("menu_items")
      .update(updates)
      .eq("id", id)
      .eq("store_id", auth.store.id);

    if (error) {
      return jsonError(error.message, 500);
    }
  }

  if (parsedPrices?.ok) {
    const { data: currentVariants, error: currentError } = await supabase
      .from("menu_item_variants")
      .select("id")
      .eq("menu_item_id", id);

    if (currentError) {
      return jsonError(currentError.message, 500);
    }

    const keepIds = new Set(
      parsedPrices.rows.map((row) => row.id).filter((value): value is string => Boolean(value)),
    );
    const toDelete = (currentVariants ?? [])
      .map((row) => row.id as string)
      .filter((variantId) => !keepIds.has(variantId));

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("menu_item_variants")
        .delete()
        .in("id", toDelete)
        .eq("menu_item_id", id);
      if (deleteError) {
        return jsonError(deleteError.message, 500);
      }
    }

    for (const [index, row] of parsedPrices.rows.entries()) {
      if (row.id) {
        const { data: owned } = await supabase
          .from("menu_item_variants")
          .select("id")
          .eq("id", row.id)
          .eq("menu_item_id", id)
          .maybeSingle();
        if (!owned) {
          return jsonError("Price option not found", 400);
        }
        const { error: updateError } = await supabase
          .from("menu_item_variants")
          .update({
            name: row.name,
            price: row.price,
            sort_order: index,
            is_available: row.is_available,
          })
          .eq("id", row.id)
          .eq("menu_item_id", id);
        if (updateError) {
          return jsonError(updateError.message, 500);
        }
      } else {
        const { error: insertError } = await supabase
          .from("menu_item_variants")
          .insert({
            menu_item_id: id,
            name: row.name,
            price: row.price,
            sort_order: index,
            is_available: row.is_available,
          });
        if (insertError) {
          return jsonError(insertError.message, 500);
        }
      }
    }
  }

  try {
    const item = await loadItemWithVariants(auth.store.id, id);
    if (!item) {
      return jsonError("Item not found", 404);
    }
    return Response.json({ item });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Could not load item";
    return jsonError(message, 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const { id } = await params;
  const existing = await getOwnedItem(auth.store.id, id);
  if (!existing) {
    return jsonError("Item not found", 404);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", id)
    .eq("store_id", auth.store.id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return new Response(null, { status: 204 });
}
