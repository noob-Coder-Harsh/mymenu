import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { nextSortOrder, getStoreMenu } from "@/lib/menu/queries";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  try {
    const menu = await getStoreMenu(auth.store.id);
    return Response.json({ categories: menu.categories });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Could not load categories";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const name = body.name?.trim() ?? "";
  if (name.length < 2) {
    return jsonError("Category name must be at least 2 characters", 400);
  }

  const supabase = getSupabaseAdmin();
  const sortOrder = await nextSortOrder("menu_categories", auth.store.id);
  const { data: category, error } = await supabase
    .from("menu_categories")
    .insert({
      store_id: auth.store.id,
      name,
      sort_order: sortOrder,
      is_active: true,
    })
    .select("*")
    .single();

  if (error || !category) {
    return jsonError(error?.message ?? "Could not create category", 500);
  }

  return Response.json({ category }, { status: 201 });
}
