import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Store, StoreSettings } from "@/lib/types/database";

export async function getStoreSettings(storeId: string): Promise<StoreSettings | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getStoreWithSettings(storeId: string): Promise<{
  store: Store;
  settings: StoreSettings;
} | null> {
  const supabase = getSupabaseAdmin();
  const [{ data: store, error: storeError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase.from("stores").select("*").eq("id", storeId).maybeSingle(),
      supabase
        .from("store_settings")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle(),
    ]);

  if (storeError) {
    throw storeError;
  }
  if (settingsError) {
    throw settingsError;
  }
  if (!store || !settings) {
    return null;
  }

  return { store, settings };
}
