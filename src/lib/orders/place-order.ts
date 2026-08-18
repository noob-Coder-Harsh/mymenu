import "server-only";

import { toE164India } from "@/lib/phone";
import { parsePrice } from "@/lib/money";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPublicStoreBySlug } from "@/lib/catalog/public-store";
import type { Order, OrderItem, PaymentMethod } from "@/lib/types/database";

export type PlaceOrderInput = {
  slug: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  notes: string;
  items: { menuItemId: string; quantity: number }[];
};

export type PlaceOrderResult = {
  order: Order;
  items: OrderItem[];
};

const MAX_LINES = 40;
const MAX_QTY = 20;

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === "upi" || value === "cash";
}

async function allocateOrderNumber(storeId: string, prefix: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("order_number")
    .eq("store_id", storeId);

  if (error) {
    throw error;
  }

  let max = 0;
  for (const row of data ?? []) {
    const raw = row.order_number;
    if (!raw.startsWith(prefix)) {
      continue;
    }
    const seq = Number.parseInt(raw.slice(prefix.length), 10);
    if (Number.isFinite(seq)) {
      max = Math.max(max, seq);
    }
  }

  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<{ ok: true; data: PlaceOrderResult } | { ok: false; message: string; status: number }> {
  const catalog = await getPublicStoreBySlug(input.slug);
  if (!catalog) {
    return { ok: false, message: "Store not found", status: 404 };
  }

  if (!catalog.store.is_open) {
    return { ok: false, message: "This store is closed", status: 409 };
  }

  const customerName = input.customerName.trim();
  if (customerName.length < 2) {
    return { ok: false, message: "Please enter your name", status: 400 };
  }

  let phone: string | null = null;
  const rawPhone = input.customerPhone.trim();
  if (rawPhone) {
    phone = toE164India(rawPhone);
    if (!phone) {
      return { ok: false, message: "Enter a valid 10-digit mobile number", status: 400 };
    }
  } else if (catalog.settings.customer_phone_required) {
    return { ok: false, message: "Phone number is required", status: 400 };
  }

  if (!isPaymentMethod(input.paymentMethod)) {
    return { ok: false, message: "Choose Cash or UPI", status: 400 };
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, message: "Your cart is empty", status: 400 };
  }
  if (input.items.length > MAX_LINES) {
    return { ok: false, message: "Too many items in this order", status: 400 };
  }

  const qtyById = new Map<string, number>();
  for (const line of input.items) {
    const quantity = Number(line.quantity);
    if (!line.menuItemId || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      return { ok: false, message: "Invalid item quantity", status: 400 };
    }
    qtyById.set(line.menuItemId, (qtyById.get(line.menuItemId) ?? 0) + quantity);
  }

  const menuById = new Map(catalog.items.map((item) => [item.id, item]));
  const lines: {
    menu_item_id: string;
    item_name: string;
    unit_price: number;
    quantity: number;
    total_amount: number;
  }[] = [];

  for (const [menuItemId, quantity] of qtyById) {
    const item = menuById.get(menuItemId);
    if (!item || !item.is_available) {
      continue;
    }
    const unitPrice = parsePrice(item.price) ?? 0;
    lines.push({
      menu_item_id: item.id,
      item_name: item.name,
      unit_price: unitPrice,
      quantity,
      total_amount: Math.round(unitPrice * quantity * 100) / 100,
    });
  }

  if (lines.length === 0) {
    return { ok: false, message: "Those items are no longer available", status: 409 };
  }

  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.total_amount, 0) * 100) / 100;
  const notes = input.notes.trim().slice(0, 300) || null;
  const orderStatus = catalog.settings.auto_accept_orders ? "accepted" : "pending";
  const supabase = getSupabaseAdmin();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const orderNumber = await allocateOrderNumber(
      catalog.store.id,
      catalog.settings.order_prefix || "ORD",
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: catalog.store.id,
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: phone,
        order_source: "qr",
        order_status: orderStatus,
        payment_method: input.paymentMethod,
        payment_status: "unpaid",
        subtotal,
        total_amount: subtotal,
        notes,
      })
      .select("*")
      .single();

    if (orderError) {
      if (orderError.code === "23505") {
        continue;
      }
      return { ok: false, message: orderError.message, status: 500 };
    }

    const { error: itemError } = await supabase.from("order_items").insert(
      lines.map((line) => ({
        order_id: order.id,
        menu_item_id: line.menu_item_id,
        item_name: line.item_name,
        unit_price: line.unit_price,
        quantity: line.quantity,
        total_amount: line.total_amount,
      })),
    );

    if (itemError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return { ok: false, message: itemError.message, status: 500 };
    }

    const { data: orderItems, error: fetchError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (fetchError || !orderItems?.length) {
      await supabase.from("orders").delete().eq("id", order.id);
      return {
        ok: false,
        message: fetchError?.message ?? "Could not save order items",
        status: 500,
      };
    }

    return {
      ok: true,
      data: {
        order: {
          ...order,
          subtotal: parsePrice(order.subtotal) ?? subtotal,
          total_amount: parsePrice(order.total_amount) ?? subtotal,
        },
        items: orderItems.map((item) => ({
          ...item,
          unit_price: parsePrice(item.unit_price) ?? 0,
          total_amount: parsePrice(item.total_amount) ?? 0,
        })),
      },
    };
  }

  return { ok: false, message: "Could not assign an order number. Try again.", status: 503 };
}
