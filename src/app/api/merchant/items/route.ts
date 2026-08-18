import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { getStoreMenu, nextSortOrder } from "@/lib/menu/queries";
import { parsePrice } from "@/lib/money";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
    price?: number | string;
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

  const price = parsePrice(body.price);
  if (price === null) {
    return jsonError("Enter a valid price", 400);
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
      price,
      sort_order: sortOrder,
      is_available: body.is_available ?? true,
      is_active: body.is_active ?? true,
    })
    .select("*")
    .single();

  if (error || !item) {
    return jsonError(error?.message ?? "Could not create item", 500);
  }

  return Response.json({ item }, { status: 201 });
}
