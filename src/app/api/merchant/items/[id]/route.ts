import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { parsePrice } from "@/lib/money";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function getOwnedItem(storeId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();
  return data;
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
    price?: number | string;
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
    price?: number;
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
  if ("price" in body) {
    const price = parsePrice(body.price);
    if (price === null) {
      return jsonError("Enter a valid price", 400);
    }
    updates.price = price;
  }
  if (typeof body.is_available === "boolean") {
    updates.is_available = body.is_available;
  }
  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("No updates provided", 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: item, error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .eq("store_id", auth.store.id)
    .select("*")
    .single();

  if (error || !item) {
    return jsonError(error?.message ?? "Could not update item", 500);
  }

  return Response.json({ item });
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
