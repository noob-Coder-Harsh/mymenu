import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CustomerOrderToken, DevicePlatform } from "@/lib/types/database";

export async function upsertCustomerOrderToken(input: {
  storeId: string;
  orderId: string;
  deviceId: string;
  token: string;
  platform: DevicePlatform;
}): Promise<CustomerOrderToken> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const deviceId = input.deviceId.trim();
  const token = input.token.trim();

  if (!deviceId || !token) {
    throw new Error("device_id and token are required");
  }

  const { data: existing, error: existingError } = await supabase
    .from("customer_order_tokens")
    .select("*")
    .eq("order_id", input.orderId)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { data, error } = await supabase
      .from("customer_order_tokens")
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
      throw error ?? new Error("Could not update customer token");
    }
    return data;
  }

  const { data, error } = await supabase
    .from("customer_order_tokens")
    .insert({
      store_id: input.storeId,
      order_id: input.orderId,
      device_id: deviceId,
      token,
      platform: input.platform,
      is_active: true,
      last_used_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Could not create customer token");
  }
  return data;
}
