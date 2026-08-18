import { requireMerchant } from "@/lib/auth/merchant";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/http";

export async function PATCH(request: Request) {
  const auth = await requireMerchant();
  if (!auth.ok) {
    return auth.response;
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const name = body.name?.trim() ?? "";
  if (name.length < 2) {
    return jsonError("Name must be at least 2 characters", 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", auth.user.id)
    .select("*")
    .single();

  if (error || !user) {
    return jsonError(error?.message ?? "Could not update profile", 500);
  }

  return Response.json({ user });
}
