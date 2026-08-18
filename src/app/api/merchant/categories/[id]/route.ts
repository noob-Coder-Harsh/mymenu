import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { MenuCategory } from "@/lib/types/database";

async function getOwnedCategory(storeId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("menu_categories")
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
  const existing = await getOwnedCategory(auth.store.id, id);
  if (!existing) {
    return jsonError("Category not found", 404);
  }

  let body: {
    name?: string;
    is_active?: boolean;
    move?: "up" | "down";
  };
  try {
    body = (await request.json()) as {
      name?: string;
      is_active?: boolean;
      move?: "up" | "down";
    };
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const supabase = getSupabaseAdmin();

  if (body.move === "up" || body.move === "down") {
    const { data: categories } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("store_id", auth.store.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const list = (categories ?? []) as MenuCategory[];
    const index = list.findIndex((category) => category.id === id);
    const swapWith = body.move === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= list.length) {
      return Response.json({ category: existing });
    }

    const reordered = [...list];
    const current = reordered[index];
    reordered[index] = reordered[swapWith];
    reordered[swapWith] = current;

    await Promise.all(
      reordered.map((category, sortOrder) =>
        supabase
          .from("menu_categories")
          .update({ sort_order: sortOrder })
          .eq("id", category.id)
          .eq("store_id", auth.store!.id),
      ),
    );

    const { data: category } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("id", id)
      .single();

    return Response.json({ category: category ?? existing });
  }

  const updates: { name?: string; is_active?: boolean } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) {
      return jsonError("Category name must be at least 2 characters", 400);
    }
    updates.name = name;
  }
  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("No updates provided", 400);
  }

  const { data: category, error } = await supabase
    .from("menu_categories")
    .update(updates)
    .eq("id", id)
    .eq("store_id", auth.store.id)
    .select("*")
    .single();

  if (error || !category) {
    return jsonError(error?.message ?? "Could not update category", 500);
  }

  return Response.json({ category });
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
  const existing = await getOwnedCategory(auth.store.id, id);
  if (!existing) {
    return jsonError("Category not found", 404);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", id)
    .eq("store_id", auth.store.id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return new Response(null, { status: 204 });
}
