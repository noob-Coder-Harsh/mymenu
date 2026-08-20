import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { parsePriceRows } from "@/lib/menu/prices";
import { getStoreMenu, nextSortOrder, normalizeMenuItem, normalizeVariant } from "@/lib/menu/queries";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { MenuItem, MenuItemVariant } from "@/lib/types/database";

export async function GET() {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  try {
    const menu = await getStoreMenu(auth.store.id);
    return Response.json({ items: menu.items });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Could not load items";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  let body: {
    name?: string;
    description?: string;
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

  const name = body.name?.trim() ?? "";
  if (name.length < 2) {
    return jsonError("Item name must be at least 2 characters", 400);
  }

  const parsed = parsePriceRows(body.prices);
  if (!parsed.ok) {
    return jsonError(parsed.message, 400);
  }

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

  const supabase = getSupabaseAdmin();
  const sortOrder = await nextSortOrder("menu_items", auth.store.id);
  const { data: item, error } = await supabase
    .from("menu_items")
    .insert({
      store_id: auth.store.id,
      category_id: categoryId,
      name,
      description: body.description?.trim() || null,
      sort_order: sortOrder,
      is_available: body.is_available ?? true,
      is_active: body.is_active ?? true,
    })
    .select("*")
    .single();

  if (error || !item) {
    return jsonError(error?.message ?? "Could not create item", 500);
  }

  const { data: variants, error: variantError } = await supabase
    .from("menu_item_variants")
    .insert(
      parsed.rows.map((row, index) => ({
        menu_item_id: item.id,
        name: row.name,
        price: row.price,
        sort_order: index,
        is_available: row.is_available,
      })),
    )
    .select("*");

  if (variantError || !variants?.length) {
    await supabase.from("menu_items").delete().eq("id", item.id);
    return jsonError(variantError?.message ?? "Could not save prices", 500);
  }

  return Response.json(
    {
      item: normalizeMenuItem(
        item as MenuItem,
        (variants as MenuItemVariant[]).map(normalizeVariant),
      ),
    },
    { status: 201 },
  );
}
