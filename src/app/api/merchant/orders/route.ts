import { requireMerchant } from "@/lib/auth/merchant";
import { jsonError } from "@/lib/http";
import { getMerchantOrders, getOrderFilterCounts } from "@/lib/orders/queries";
import { parseOrderFilter } from "@/lib/orders/status";

export async function GET(request: Request) {
  const auth = await requireMerchant({ storeRequired: true });
  if (!auth.ok || !auth.store) {
    return auth.ok ? jsonError("Create your store first", 403) : auth.response;
  }

  const filter = parseOrderFilter(new URL(request.url).searchParams.get("filter"));

  try {
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
