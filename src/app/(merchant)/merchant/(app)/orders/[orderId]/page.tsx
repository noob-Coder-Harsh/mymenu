import { notFound, redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getMerchantOrder } from "@/lib/orders/queries";
import { canTogglePayment } from "@/lib/orders/status";
import { formatInr } from "@/lib/money";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatTimeIst } from "@/lib/time";
import { ORDER_SOURCE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/types/labels";
import { LiveRefresh } from "../../_components/live-refresh";
import { OrderStatusActions } from "../_components/order-status-actions";
import { OrderStatusBadge } from "../_components/order-status-badge";
import { PaymentToggle } from "../_components/payment-toggle";

export const dynamic = "force-dynamic";

export default async function MerchantOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const { orderId } = await params;
  const order = await getMerchantOrder(context.store.id, orderId);
  if (!order) {
    notFound();
  }

  return (
    <section className="flex flex-col gap-5">
      <LiveRefresh />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">#{order.order_number}</h1>
          <p className="text-sm text-muted">
            {formatTimeIst(order.created_at)}
            {order.order_source === "counter"
              ? ` · ${ORDER_SOURCE_LABELS.counter}`
              : ""}
            {order.is_takeaway ? " · Takeaway" : ""}
          </p>
        </div>
        <OrderStatusBadge status={order.order_status} />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-medium tracking-wide text-muted">Customer</p>
        <p className="mt-1 font-medium">{order.customer_name || "Guest"}</p>
        {order.customer_phone ? (
          <p className="text-sm text-muted">{formatPhoneDisplay(order.customer_phone)}</p>
        ) : (
          <p className="text-sm text-muted">No phone</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-medium tracking-wide text-muted">Items</p>
        <div className="mt-3 flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity} × {item.item_name}
              </span>
              <span>{formatInr(item.total_amount)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatInr(order.total_amount)}</span>
        </div>
      </section>

      {order.notes ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-medium tracking-wide text-muted">Notes</p>
          <p className="mt-1 text-sm">{order.notes}</p>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-wide text-muted">
          Payment · {PAYMENT_METHOD_LABELS[order.payment_method]}
        </p>
        <PaymentToggle
          key={order.payment_status}
          orderId={order.id}
          paymentStatus={order.payment_status}
          disabled={!canTogglePayment(order.order_status)}
        />
      </section>

      <OrderStatusActions key={order.order_status} orderId={order.id} status={order.order_status} />
    </section>
  );
}
