import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import {
  getActiveOpsOrders,
  getMerchantOrders,
  getOrderFilterCounts,
  getOrdersUpdatedSince,
} from "@/lib/orders/queries";
import { placeOrder } from "@/lib/orders/place-order";
import { parseOrderFilter } from "@/lib/orders/status";
import type { PaymentMethod } from "@/lib/types/database";

/** If client `since` is older than this, force a full active snapshot. */
const MAX_DELTA_AGE_MS = 10 * 60 * 1000;

function parseSince(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    return null;
  }
  return new Date(time);
}

export async function GET(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const syncedAt = new Date().toISOString();

  try {
    if (scope === "active") {
      const since = parseSince(url.searchParams.get("since"));
      const forceFull = url.searchParams.get("full") === "1";
      const sinceAgeMs = since ? Date.now() - since.getTime() : Number.POSITIVE_INFINITY;
      const useDelta =
        !forceFull && since !== null && sinceAgeMs >= 0 && sinceAgeMs <= MAX_DELTA_AGE_MS;

      if (useDelta && since) {
        const changes = await getOrdersUpdatedSince(auth.store.id, since.toISOString());
        // Too many changes in the window — fall back to a full active snapshot.
        if (changes.length >= 80) {
          const active = await getActiveOpsOrders(auth.store.id);
          return Response.json({
            mode: "full" as const,
            orders: active,
            syncedAt,
            pendingCount: active.filter((order) => order.order_status === "pending")
              .length,
          });
        }
        return Response.json({
          mode: "delta" as const,
          orders: changes,
          syncedAt,
        });
      }

      const active = await getActiveOpsOrders(auth.store.id);
      return Response.json({
        mode: "full" as const,
        orders: active,
        syncedAt,
        pendingCount: active.filter((order) => order.order_status === "pending")
          .length,
      });
    }

    const filter = parseOrderFilter(url.searchParams.get("filter"));
    const [orders, counts] = await Promise.all([
      getMerchantOrders(auth.store.id, filter),
      getOrderFilterCounts(auth.store.id),
    ]);
    return Response.json({ orders, counts, filter, syncedAt });
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
