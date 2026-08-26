import { requireMerchant } from "@/lib/auth/merchant";
import { upsertDeviceToken } from "@/lib/devices/upsert-device-token";
import { jsonError } from "@/lib/http";
import type { DevicePlatform } from "@/lib/types/database";

const PLATFORMS = new Set<DevicePlatform>(["ios", "android", "web"]);

export async function POST(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  let body: {
    device_id?: string;
    token?: string;
    platform?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const deviceId = body.device_id?.trim() ?? "";
  const token = body.token?.trim() ?? "";
  const platform = body.platform?.trim() as DevicePlatform | undefined;

  if (deviceId.length < 8 || deviceId.length > 128) {
    return jsonError("Invalid device_id", 400);
  }
  if (token.length < 20 || token.length > 4096) {
    return jsonError("Invalid token", 400);
  }
  if (!platform || !PLATFORMS.has(platform)) {
    return jsonError("Invalid platform", 400);
  }

  try {
    const row = await upsertDeviceToken({
      userId: auth.user.id,
      storeId: auth.store.id,
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
