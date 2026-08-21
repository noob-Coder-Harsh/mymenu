import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { getActiveOpsOrders, getMerchantOrders, getOrderFilterCounts } from "@/lib/orders/queries";
import { placeOrder } from "@/lib/orders/place-order";
import { parseOrderFilter } from "@/lib/orders/status";
import type { PaymentMethod } from "@/lib/types/database";

export async function GET(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");

  try {
    if (scope === "active") {
      const active = await getActiveOpsOrders(auth.store.id);
      return Response.json({
        orders: active,
        pendingCount: active.filter((order) => order.order_status === "pending")
          .length,
      });
    }

    const filter = parseOrderFilter(url.searchParams.get("filter"));
    const [orders, counts] = await Promise.all([
      getMerchantOrders(auth.store.id, filter),
      getOrderFilterCounts(auth.store.id),
    ]);
    return Response.json({ orders, counts, filter });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Could not load orders";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  let body: {
    customer_name?: string;
    customer_phone?: string;
    payment_method?: PaymentMethod;
    notes?: string;
    is_takeaway?: boolean;
    items?: { menu_item_variant_id?: string; quantity?: number }[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const result = await placeOrder({
    slug: auth.store.slug,
    customerName: body.customer_name ?? "",
    customerPhone: body.customer_phone ?? "",
    paymentMethod: body.payment_method ?? "cash",
    notes: body.notes ?? "",
    orderSource: "counter",
    isTakeaway: body.is_takeaway === true,
    items: (body.items ?? []).map((item) => ({
      menuItemVariantId: item.menu_item_variant_id ?? "",
      quantity: item.quantity ?? 0,
    })),
  });

  if (!result.ok) {
    return jsonError(result.message, result.status);
  }

  return Response.json(result.data, { status: 201 });
}
