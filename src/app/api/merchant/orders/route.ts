import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { getActiveOpsOrders, getMerchantOrders, getOrderFilterCounts } from "@/lib/orders/queries";
import { toHomeOrder } from "@/lib/orders/home-order";
import { parseOrderFilter } from "@/lib/orders/status";

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
        orders: active.map(toHomeOrder),
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
