import Link from "next/link";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { formatInr } from "@/lib/money";
import { orderCardOutlineClass } from "@/lib/orders/card-outline";
import { getSalesReport } from "@/lib/orders/sales-report";
import { formatTimeIst } from "@/lib/time";
import {
  ORDER_SOURCE_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types/labels";

export const dynamic = "force-dynamic";

export default async function MerchantReportsPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const report = await getSalesReport(context.store.id);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sales report</h1>
        <p className="text-sm text-muted">Today's orders and sales</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Sales" value={formatInr(report.todaySales)} />
        <StatCard label="Paid" value={formatInr(report.todayPaidSales)} />
        <StatCard label="Orders" value={String(report.todayCount)} />
        <StatCard label="Customers" value={String(report.customersToday)} />
      </div>

      <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
        <div className="flex justify-between gap-3 py-1.5">
          <span className="text-muted">Completed</span>
          <span className="font-semibold">{report.completedCount}</span>
        </div>
        <div className="flex justify-between gap-3 py-1.5">
          <span className="text-muted">Waiting</span>
          <span className="font-semibold">{report.pendingCount}</span>
        </div>
        <div className="flex justify-between gap-3 py-1.5">
          <span className="text-muted">Cancelled</span>
          <span className="font-semibold">{report.cancelledCount}</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-border py-1.5 pt-2.5">
          <span className="text-muted">Eat in</span>
          <span className="font-semibold">{report.dineInCount}</span>
        </div>
        <div className="flex justify-between gap-3 py-1.5">
          <span className="text-muted">Takeaway</span>
          <span className="font-semibold">{report.takeawayCount}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
          Today's orders
        </h2>
        {report.todayOrders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            No orders yet today.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {report.todayOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/merchant/orders/${order.id}`}
                  className={`flex items-center gap-3 rounded-2xl border-2 bg-surface px-3.5 py-3 ${orderCardOutlineClass(order.order_status, order.payment_status)}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      #{order.order_number}
                      {order.is_takeaway ? (
                        <span className="font-medium text-accent"> · Takeaway</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {ORDER_STATUS_LABELS[order.order_status]} ·{" "}
                      {PAYMENT_STATUS_LABELS[order.payment_status]}
                      {order.order_source === "counter"
                        ? ` · ${ORDER_SOURCE_LABELS.counter}`
                        : ""}{" "}
                      · {formatTimeIst(order.created_at)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {formatInr(order.total_amount)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-3.5 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
