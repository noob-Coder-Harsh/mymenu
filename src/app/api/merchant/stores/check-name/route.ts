import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { isStoreNameTaken } from "@/lib/stores/availability";
import { slugify } from "@/lib/stores/slug";

export async function GET(request: Request) {
  const auth = await requireMerchant();
  if (!auth.ok) {
    return auth.response;
  }

  const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";
  if (name.length < 2) {
    return jsonError("Store name must be at least 2 characters", 400);
  }

  const excludeStoreId = auth.store?.id;
  const taken = await isStoreNameTaken(name, excludeStoreId);

  return Response.json({
    available: !taken,
    slug: slugify(name),
  });
}
