import "server-only";

import { getFirebaseAdminMessaging } from "@/lib/firebase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatInr } from "@/lib/money";
import { CUSTOMER_STATUS_LABELS } from "@/lib/types/labels";
import type { Order, OrderStatus } from "@/lib/types/database";

const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

function absoluteAppUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

async function sendToTokens(input: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<string[]> {
  const unique = [...new Set(input.tokens.map((token) => token.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return [];
  }

  const link = input.data?.url ? absoluteAppUrl(input.data.url) : undefined;
  const messaging = getFirebaseAdminMessaging();
  const response = await messaging.sendEachForMulticast({
    tokens: unique,
    notification: {
      title: input.title,
      body: input.body,
    },
    data: input.data,
    webpush: link
      ? {
          fcmOptions: { link },
        }
      : undefined,
  });

  const invalid: string[] = [];
  response.responses.forEach((result, index) => {
    if (result.success) {
      return;
    }
    const code = result.error?.code;
    if (code && INVALID_TOKEN_CODES.has(code)) {
      invalid.push(unique[index]!);
    }
  });
  return invalid;
}

async function deactivateMerchantTokens(tokens: string[]) {
  if (tokens.length === 0) {
    return;
  }
  const supabase = getSupabaseAdmin();
  await supabase.from("device_tokens").update({ is_active: false }).in("token", tokens);
}

async function deactivateCustomerTokens(tokens: string[]) {
  if (tokens.length === 0) {
    return;
  }
  const supabase = getSupabaseAdmin();
  await supabase
    .from("customer_order_tokens")
    .update({ is_active: false })
    .in("token", tokens);
}

export async function notifyMerchantsNewOrder(input: {
  storeId: string;
  storeSlug: string;
  order: Pick<Order, "id" | "order_number" | "total_amount" | "customer_name">;
}) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("store_id", input.storeId)
      .eq("is_active", true);

    if (error || !data?.length) {
      return;
    }

    const name = input.order.customer_name?.trim() || "Customer";
    const invalid = await sendToTokens({
      tokens: data.map((row) => row.token),
      title: "New order",
      body: `#${input.order.order_number} · ${name} · ${formatInr(input.order.total_amount)}`,
      data: {
        type: "merchant_new_order",
        orderId: input.order.id,
        url: `/merchant/orders/${input.order.id}`,
      },
    });
    await deactivateMerchantTokens(invalid);
  } catch {
    // Never fail the order path because of push.
  }
}

function customerStatusCopy(status: OrderStatus): { title: string; body: string } | null {
  switch (status) {
    case "accepted":
      return {
        title: "Order accepted",
        body: "The kitchen has your order.",
      };
    case "preparing":
      return {
        title: "Preparing your order",
        body: "Your order is being made.",
      };
    case "ready":
      return {
        title: "Ready for pickup",
        body: "Please collect your order.",
      };
    case "completed":
      return {
        title: "Order completed",
        body: "Enjoy your order!",
      };
    case "cancelled":
      return {
        title: "Order cancelled",
        body: "This order was cancelled.",
      };
    default:
      return null;
  }
}

export async function notifyCustomerOrderStatus(input: {
  storeId: string;
  storeSlug: string;
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
}) {
  const copy = customerStatusCopy(input.status);
  if (!copy) {
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("customer_order_tokens")
      .select("token")
      .eq("order_id", input.orderId)
      .eq("is_active", true);

    if (error || !data?.length) {
      return;
    }

    const invalid = await sendToTokens({
      tokens: data.map((row) => row.token),
      title: copy.title,
      body: `#${input.orderNumber} · ${CUSTOMER_STATUS_LABELS[input.status]} — ${copy.body}`,
      data: {
        type: "customer_order_status",
        orderId: input.orderId,
        status: input.status,
        url: `/s/${input.storeSlug}/orders/${input.orderId}`,
      },
    });
    await deactivateCustomerTokens(invalid);
  } catch {
    // Never fail the status update path because of push.
  }
}
