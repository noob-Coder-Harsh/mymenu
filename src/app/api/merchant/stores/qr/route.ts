import { requireMerchant } from "@/lib/auth/merchant";
import { STORE_ASSETS_BUCKET } from "@/lib/constants";
import { jsonError } from "@/lib/http";
import { isQrDesignId, type QrDesignId } from "@/lib/qr/designs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { storeAssetPath } from "@/lib/supabase/storage";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const formData = await request.formData();
  const files = formData.getAll("files");
  const designFields = formData.getAll("designs");

  if (files.length === 0) {
    return jsonError("No QR images provided", 400);
  }
  if (files.length !== designFields.length) {
    return jsonError("Each file needs a design id", 400);
  }

  const supabase = getSupabaseAdmin();
  const urls: Partial<Record<QrDesignId, string>> = {};

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const designRaw = designFields[index];
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("Invalid QR image", 400);
    }
    if (file.size > MAX_BYTES) {
      return jsonError("QR image is too large", 400);
    }
    if (typeof designRaw !== "string" || !isQrDesignId(designRaw)) {
      return jsonError("Unknown QR design", 400);
    }
    if (file.type && file.type !== "image/png") {
      return jsonError("QR must be a PNG", 400);
    }

    const path = storeAssetPath(auth.store.id, "qr", `${designRaw}.png`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(STORE_ASSETS_BUCKET)
      .upload(path, buffer, {
        contentType: "image/png",
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
    urls[designRaw] = `${publicUrl.publicUrl}?v=${Date.now()}`;
  }

  return Response.json({ urls });
}
