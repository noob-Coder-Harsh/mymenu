import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { toE164India } from "@/lib/phone";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { allocateSlug, isStoreNameTaken } from "@/lib/stores/availability";
import type { StoreSettings } from "@/lib/types/database";

export async function GET() {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const supabase = getSupabaseAdmin();
  const { data: settings, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", auth.store.id)
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  return Response.json({ store: auth.store, settings });
}

export async function POST(request: Request) {
  const auth = await requireMerchant();
  if (!auth.ok) {
    return auth.response;
  }

  if (auth.store) {
    return jsonError("Store already exists", 409);
  }

  let body: { name?: string; phone?: string };
  try {
    body = (await request.json()) as { name?: string; phone?: string };
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const name = body.name?.trim() ?? "";
  if (name.length < 2) {
    return jsonError("Store name must be at least 2 characters", 400);
  }

  if (await isStoreNameTaken(name)) {
    return jsonError("Name already exists — use a different one", 409);
  }

  const phone = body.phone?.trim() || auth.user.phone;
  const slug = await allocateSlug(name);
  const supabase = getSupabaseAdmin();

  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      owner_user_id: auth.user.id,
      name,
      slug,
      phone,
      is_open: false,
      is_active: true,
    })
    .select("*")
    .single();

  if (error || !store) {
    return jsonError(error?.message ?? "Could not create store", 500);
  }

  if (auth.user.name === "Merchant") {
    await supabase.from("users").update({ name }).eq("id", auth.user.id);
  }

  return Response.json({ store }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  let body: {
    is_open?: boolean;
    name?: string;
    phone?: string | null;
    description?: string | null;
    upi_id?: string | null;
    logo_url?: string | null;
    settings?: {
      currency?: string;
      order_prefix?: string;
      customer_phone_required?: boolean;
      order_notifications_enabled?: boolean;
      auto_accept_orders?: boolean;
    };
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const storeUpdates: {
    is_open?: boolean;
    name?: string;
    slug?: string;
    phone?: string | null;
    description?: string | null;
    upi_id?: string | null;
    logo_url?: string | null;
  } = {};

  if (typeof body.is_open === "boolean") {
    storeUpdates.is_open = body.is_open;
  }

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) {
      return jsonError("Store name must be at least 2 characters", 400);
    }
    if (name.toLowerCase() !== auth.store.name.toLowerCase()) {
      if (await isStoreNameTaken(name, auth.store.id)) {
        return jsonError("Name already exists — use a different one", 409);
      }
      storeUpdates.name = name;
      storeUpdates.slug = await allocateSlug(name, auth.store.id);
    } else if (name !== auth.store.name) {
      storeUpdates.name = name;
    }
  }

  if ("phone" in body) {
    if (body.phone === null || body.phone === "") {
      storeUpdates.phone = null;
    } else if (typeof body.phone === "string") {
      const phone = toE164India(body.phone);
      if (!phone) {
        return jsonError("Enter a valid 10-digit mobile number", 400);
      }
      storeUpdates.phone = phone;
    }
  }

  if ("description" in body) {
    storeUpdates.description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, 500) || null
        : null;
  }

  if ("upi_id" in body) {
    if (body.upi_id === null || body.upi_id === "") {
      storeUpdates.upi_id = null;
    } else if (typeof body.upi_id === "string") {
      const upi = body.upi_id.trim().toLowerCase();
      if (upi && !/^[\w.-]+@[\w.-]+$/.test(upi)) {
        return jsonError("Enter a valid UPI ID (e.g. shop@upi)", 400);
      }
      storeUpdates.upi_id = upi || null;
    }
  }

  if ("logo_url" in body) {
    storeUpdates.logo_url =
      typeof body.logo_url === "string" && body.logo_url.trim()
        ? body.logo_url.trim()
        : null;
  }

  const settingsUpdates: Partial<
    Pick<
      StoreSettings,
      | "currency"
      | "order_prefix"
      | "customer_phone_required"
      | "order_notifications_enabled"
      | "auto_accept_orders"
    >
  > = {};

  if (body.settings && typeof body.settings === "object") {
    const settings = body.settings;
    if (typeof settings.currency === "string") {
      const currency = settings.currency.trim().toUpperCase().slice(0, 8);
      if (!currency) {
        return jsonError("Currency is required", 400);
      }
      settingsUpdates.currency = currency;
    }
    if (typeof settings.order_prefix === "string") {
      const prefix = settings.order_prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (prefix.length < 1 || prefix.length > 8) {
        return jsonError("Order prefix should be 1–8 letters or numbers", 400);
      }
      settingsUpdates.order_prefix = prefix;
    }
    if (typeof settings.customer_phone_required === "boolean") {
      settingsUpdates.customer_phone_required = settings.customer_phone_required;
    }
    if (typeof settings.order_notifications_enabled === "boolean") {
      settingsUpdates.order_notifications_enabled =
        settings.order_notifications_enabled;
    }
    if (typeof settings.auto_accept_orders === "boolean") {
      settingsUpdates.auto_accept_orders = settings.auto_accept_orders;
    }
  }

  if (
    Object.keys(storeUpdates).length === 0 &&
    Object.keys(settingsUpdates).length === 0
  ) {
    return jsonError("No updates provided", 400);
  }

  const supabase = getSupabaseAdmin();
  let store = auth.store;
  let settings: StoreSettings | null = null;

  if (Object.keys(storeUpdates).length > 0) {
    const { data, error } = await supabase
      .from("stores")
      .update(storeUpdates)
      .eq("id", auth.store.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Could not update store", 500);
    }
    store = data;
  }

  if (Object.keys(settingsUpdates).length > 0) {
    const { data, error } = await supabase
      .from("store_settings")
      .update(settingsUpdates)
      .eq("store_id", auth.store.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Could not update settings", 500);
    }
    settings = data;
  } else {
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .eq("store_id", auth.store.id)
      .maybeSingle();
    settings = data;
  }

  return Response.json({ store, settings });
}
