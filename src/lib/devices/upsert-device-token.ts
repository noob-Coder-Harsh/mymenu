import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { DevicePlatform, DeviceToken } from "@/lib/types/database";

export async function upsertDeviceToken(input: {
  userId: string;
  storeId: string;
  deviceId: string;
  token: string;
  platform: DevicePlatform;
}): Promise<DeviceToken> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const deviceId = input.deviceId.trim();
  const token = input.token.trim();

  if (!deviceId || !token) {
    throw new Error("device_id and token are required");
  }

  const { data: tokenOwner, error: tokenLookupError } = await supabase
    .from("device_tokens")
    .select("id, user_id, device_id")
    .eq("token", token)
    .maybeSingle();

  if (tokenLookupError) {
    throw tokenLookupError;
  }

  if (
    tokenOwner &&
    (tokenOwner.user_id !== input.userId || tokenOwner.device_id !== deviceId)
  ) {
    const { error: deleteError } = await supabase
      .from("device_tokens")
      .delete()
      .eq("id", tokenOwner.id);
    if (deleteError) {
      throw deleteError;
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from("device_tokens")
    .select("*")
    .eq("user_id", input.userId)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { data, error } = await supabase
      .from("device_tokens")
      .update({
        store_id: input.storeId,
        token,
        platform: input.platform,
        is_active: true,
        last_used_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw error ?? new Error("Could not update device token");
    }
    return data;
  }

  const { data, error } = await supabase
    .from("device_tokens")
    .insert({
      user_id: input.userId,
      store_id: input.storeId,
      device_id: deviceId,
      token,
      platform: input.platform,
      is_active: true,
      last_used_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Could not create device token");
  }
  return data;
}
