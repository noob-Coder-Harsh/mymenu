import { requireMerchant } from "@/lib/auth/merchant";
import { STORE_ASSETS_BUCKET } from "@/lib/constants";
import { jsonError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { storeAssetPath } from "@/lib/supabase/storage";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: item } = await supabase
    .from("menu_items")
    .select("id")
    .eq("id", id)
    .eq("store_id", auth.store.id)
    .maybeSingle();

  if (!item) {
    return jsonError("Item not found", 404);
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose an image", 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonError("Image must be under 2 MB", 400);
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return jsonError("Use a JPG, PNG, or WebP image", 400);
  }

  const path = storeAssetPath(auth.store.id, "item", `${id}.${extension}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(STORE_ASSETS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return jsonError(
      uploadError.message.includes("Bucket")
        ? "Image storage is not set up. Run the storage section of schema.sql in Supabase."
        : uploadError.message,
      500,
    );
  }

  const { data: publicUrl } = supabase.storage
    .from(STORE_ASSETS_BUCKET)
    .getPublicUrl(path);

  const { data: updated, error } = await supabase
    .from("menu_items")
    .update({ image_url: `${publicUrl.publicUrl}?v=${Date.now()}` })
    .eq("id", id)
    .eq("store_id", auth.store.id)
    .select("*")
    .single();

  if (error || !updated) {
    return jsonError(error?.message ?? "Could not save image", 500);
  }

  return Response.json({ item: updated });
}
