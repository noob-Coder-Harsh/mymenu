import Link from "next/link";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getMerchantOrders, getOrderFilterCounts } from "@/lib/orders/queries";
import { parseOrderFilter } from "@/lib/orders/status";
import { LiveRefresh } from "../_components/live-refresh";
import { OrderCard } from "./_components/order-card";
import { OrderFilters } from "./_components/order-filters";
import { OrdersCacheHydrator } from "./_components/orders-cache-hydrator";

export const dynamic = "force-dynamic";

export default async function MerchantOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const { filter: filterParam } = await searchParams;
  const filter = parseOrderFilter(filterParam);
  const [orders, counts] = await Promise.all([
    getMerchantOrders(context.store.id, filter),
    getOrderFilterCounts(context.store.id),
  ]);

  return (
    <section className="flex flex-col gap-5">
      <OrdersCacheHydrator orders={orders} />
      <LiveRefresh />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted">
          New is waiting to accept. Accepted orders sit in Preparing until you mark them ready.
        </p>
      </div>

      <OrderFilters current={filter} counts={counts} />

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center">
          <p className="text-sm text-muted">
            {counts.all === 0
              ? "No orders yet. Share your menu link and keep the store open."
              : "No orders in this tab."}
          </p>
          {counts.all === 0 ? (
            <Link href="/merchant" className="mt-3 inline-block text-sm font-medium text-accent">
              Back to home
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </section>
  );
}
