import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { notifyCustomerOrderStatus } from "@/lib/notifications/fcm";
import { getMerchantOrder } from "@/lib/orders/queries";
import {
  canTogglePayment,
  canTransition,
  isOrderStatus,
  isPaymentStatus,
} from "@/lib/orders/status";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { OrderStatus, PaymentStatus } from "@/lib/types/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const { id } = await params;
  const order = await getMerchantOrder(auth.store.id, id);
  if (!order) {
    return jsonError("Order not found", 404);
  }

  return Response.json({ order });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const { id } = await params;
  const existing = await getMerchantOrder(auth.store.id, id);
  if (!existing) {
    return jsonError("Order not found", 404);
  }

  let body: { order_status?: string; payment_status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const updates: {
    order_status?: OrderStatus;
    payment_status?: PaymentStatus;
  } = {};

  if (typeof body.order_status === "string") {
    if (!isOrderStatus(body.order_status)) {
      return jsonError("Invalid order status", 400);
    }
    if (!canTransition(existing.order_status, body.order_status)) {
      return jsonError("That status change is not allowed", 409);
    }
    updates.order_status = body.order_status;
  }

  if (typeof body.payment_status === "string") {
    if (!isPaymentStatus(body.payment_status)) {
      return jsonError("Mark payment as unpaid or paid", 400);
    }
    if (!canTogglePayment(existing.order_status) && !updates.order_status) {
      return jsonError("Cannot change payment on a cancelled order", 409);
    }
    if (updates.order_status === "cancelled") {
      return jsonError("Cannot change payment while cancelling", 409);
    }
    updates.payment_status = body.payment_status;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("No updates provided", 400);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .eq("store_id", auth.store.id);

  if (error) {
    return jsonError(error.message, 500);
  }

  const order = await getMerchantOrder(auth.store.id, id);
  if (!order) {
    return jsonError("Order not found", 404);
  }

  if (updates.order_status && updates.order_status !== existing.order_status) {
    void notifyCustomerOrderStatus({
      storeId: auth.store.id,
      storeSlug: auth.store.slug,
      orderId: order.id,
      orderNumber: order.order_number,
      status: updates.order_status,
    });
  }

  return Response.json({ order });
}
