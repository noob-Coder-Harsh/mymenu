import Link from "next/link";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getDashboardStats } from "@/lib/orders/queries";
import { formatInr } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/types/labels";
import { LiveRefresh } from "./_components/live-refresh";
import { StoreOpenToggle } from "./_components/store-open-toggle";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const stats = await getDashboardStats(context.store.id);

  return (
    <section className="flex flex-col gap-6">
      <LiveRefresh intervalMs={5000} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted">Hello</p>
          <h1 className="text-2xl font-semibold tracking-tight">{context.user.name}</h1>
          <p className="text-sm text-muted">{context.store.name}</p>
        </div>
        <Link href="/merchant/account" className="text-sm font-medium text-accent">
          Account
        </Link>
      </div>

      <StoreOpenToggle isOpen={context.store.is_open} />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Today</p>
          <p className="text-xl font-semibold">{stats.todayCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Sales</p>
          <p className="text-xl font-semibold">{formatInr(stats.todaySales)}</p>
        </div>
        <Link href="/merchant/orders?filter=new" className="rounded-2xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">New</p>
          <p className="text-xl font-semibold">{stats.pendingCount}</p>
        </Link>
      </div>

      {stats.recent.length > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link href="/merchant/orders" className="text-sm font-medium text-accent">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {stats.recent.map((order) => (
              <Link
                key={order.id}
                href={`/merchant/orders/${order.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="font-medium">#{order.order_number}</p>
                  <p className="text-xs text-muted">{ORDER_STATUS_LABELS[order.order_status]}</p>
                </div>
                <p className="text-sm font-semibold">{formatInr(order.total_amount)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted">No orders yet. Keep the store open and share your menu.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/merchant/menu/new"
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium"
        >
          Add item
        </Link>
        <Link
          href="/merchant/orders"
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium"
        >
          View orders
        </Link>
      </div>

      <Link
        href={`/s/${context.store.slug}`}
        className="flex h-12 items-center justify-center rounded-2xl bg-accent text-sm font-medium text-accent-foreground"
      >
        View customer menu
      </Link>
    </section>
  );
}
