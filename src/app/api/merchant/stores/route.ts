import { requireMerchant } from "@/lib/auth/merchant";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/http";
import { slugify, uniqueSlugCandidate } from "@/lib/stores/slug";

async function allocateSlug(baseName: string) {
  const supabase = getSupabaseAdmin();
  let candidate = slugify(baseName);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }

    candidate = uniqueSlugCandidate(slugify(baseName));
  }

  return uniqueSlugCandidate(slugify(baseName));
}

export async function POST(request: Request) {
  const auth = await requireMerchant();
  if (!auth.ok) {
    return auth.response;
  }

  if (auth.store) {
    return jsonError("Store already exists", 409);
  }

  let body: { name?: string; phone?: string };
  try {
    body = (await request.json()) as { name?: string; phone?: string };
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const name = body.name?.trim() ?? "";
  if (name.length < 2) {
    return jsonError("Store name must be at least 2 characters", 400);
  }

  const phone = body.phone?.trim() || auth.user.phone;
  const slug = await allocateSlug(name);
  const supabase = getSupabaseAdmin();

  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      owner_user_id: auth.user.id,
      name,
      slug,
      phone,
      is_open: false,
      is_active: true,
    })
    .select("*")
    .single();

  if (error || !store) {
    return jsonError(error?.message ?? "Could not create store", 500);
  }

  if (auth.user.name === "Merchant") {
    await supabase.from("users").update({ name }).eq("id", auth.user.id);
  }

  return Response.json({ store }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok) {
    return auth.response;
  }

  if (!auth.store) {
    return jsonError("Create your store first", 403);
  }

  let body: { is_open?: boolean; name?: string; phone?: string };
  try {
    body = (await request.json()) as {
      is_open?: boolean;
      name?: string;
      phone?: string;
    };
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const updates: {
    is_open?: boolean;
    name?: string;
    phone?: string;
  } = {};

  if (typeof body.is_open === "boolean") {
    updates.is_open = body.is_open;
  }
  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    updates.name = body.name.trim();
  }
  if (typeof body.phone === "string") {
    updates.phone = body.phone.trim();
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("No updates provided", 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: store, error } = await supabase
    .from("stores")
    .update(updates)
    .eq("id", auth.store.id)
    .select("*")
    .single();

  if (error || !store) {
    return jsonError(error?.message ?? "Could not update store", 500);
  }

  return Response.json({ store });
}
