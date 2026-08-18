import "server-only";

import { readSessionCookie, verifySessionCookieValue } from "@/lib/auth/session";
import { jsonError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Store, User } from "@/lib/types/database";

export type MerchantContext = {
  user: User;
  store: Store | null;
};

export async function getMerchantContext(): Promise<MerchantContext | null> {
  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await verifySessionCookieValue(sessionCookie);
    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", decoded.uid)
      .maybeSingle();

    if (error || !user || !user.is_active) {
      return null;
    }

    const { data: store } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return { user, store: store ?? null };
  } catch {
    return null;
  }
}

export async function requireMerchant(options?: { storeRequired?: boolean }) {
  const context = await getMerchantContext();
  if (!context) {
    return {
      ok: false as const,
      response: jsonError("Unauthorized", 401),
    };
  }

  if (options?.storeRequired && !context.store) {
    return {
      ok: false as const,
      response: jsonError("Create your store first", 403),
    };
  }

  return { ok: true as const, ...context };
}

export async function upsertMerchantFromFirebase(input: {
  firebaseUid: string;
  phone: string;
  name?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("*")
    .eq("firebase_uid", input.firebaseUid)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    if (existing.phone !== input.phone) {
      const { data: updated, error } = await supabase
        .from("users")
        .update({ phone: input.phone })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) {
        throw error;
      }
      return updated;
    }
    return existing;
  }

  const { data: created, error } = await supabase
    .from("users")
    .insert({
      firebase_uid: input.firebaseUid,
      phone: input.phone,
      name: input.name?.trim() || "Merchant",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("This phone is already registered with another account.");
    }
    throw error;
  }

  return created;
}
