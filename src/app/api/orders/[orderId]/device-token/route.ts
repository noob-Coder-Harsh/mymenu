import { upsertCustomerOrderToken } from "@/lib/devices/upsert-customer-order-token";
import { jsonError } from "@/lib/http";
import { getPublicOrder, getPublicStoreBySlug } from "@/lib/catalog/public-store";
import type { DevicePlatform } from "@/lib/types/database";

const PLATFORMS = new Set<DevicePlatform>(["ios", "android", "web"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  let body: {
    slug?: string;
    device_id?: string;
    token?: string;
    platform?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const slug = body.slug?.trim() ?? "";
  const deviceId = body.device_id?.trim() ?? "";
  const token = body.token?.trim() ?? "";
  const platform = body.platform?.trim() as DevicePlatform | undefined;

  if (!slug) {
    return jsonError("Store slug is required", 400);
  }
  if (deviceId.length < 8 || deviceId.length > 128) {
    return jsonError("Invalid device_id", 400);
  }
  if (token.length < 20 || token.length > 4096) {
    return jsonError("Invalid token", 400);
  }
  if (!platform || !PLATFORMS.has(platform)) {
    return jsonError("Invalid platform", 400);
  }

  const catalog = await getPublicStoreBySlug(slug);
  if (!catalog) {
    return jsonError("Store not found", 404);
  }

  const order = await getPublicOrder(catalog.store.id, orderId);
  if (!order) {
    return jsonError("Order not found", 404);
  }

  try {
    const row = await upsertCustomerOrderToken({
      storeId: catalog.store.id,
      orderId: order.order.id,
      deviceId,
      token,
      platform,
    });
    return Response.json({ ok: true, deviceToken: row });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Could not save device token";
    return jsonError(message, 500);
  }
}
