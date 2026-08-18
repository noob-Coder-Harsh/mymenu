import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOrder, getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { formatInr } from "@/lib/money";
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_STEPS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/types/labels";
import type { OrderStatus } from "@/lib/types/database";

export default async function CustomerOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; orderId: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { slug, orderId } = await params;
  const { placed } = await searchParams;
  const catalog = await getPublicStoreBySlug(slug);
  if (!catalog) {
    notFound();
  }

  const data = await getPublicOrder(catalog.store.id, orderId);
  if (!data) {
    notFound();
  }

  const justPlaced = placed === "1";
  const status = data.order.order_status;
  const currentIndex = CUSTOMER_STATUS_STEPS.indexOf(status);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-5">
      {justPlaced ? (
        <section className="rounded-2xl border border-border bg-surface px-4 py-6 text-center">
          <p className="text-3xl">✓</p>
          <h1 className="mt-2 text-xl font-semibold">Order placed</h1>
          <p className="mt-1 text-sm text-muted">We have received your order.</p>
        </section>
      ) : (
        <h1 className="text-xl font-semibold tracking-tight">Order status</h1>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-muted">Order number</p>
        <p className="text-lg font-semibold">#{data.order.order_number}</p>
        <p className="mt-1 text-sm text-muted">
          {PAYMENT_METHOD_LABELS[data.order.payment_method]} · {formatInr(data.order.total_amount)}
        </p>
      </section>

      {data.order.payment_method === "upi" ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-medium">Pay with UPI</p>
          {catalog.store.upi_id ? (
            <p className="mt-1 break-all text-lg font-semibold">{catalog.store.upi_id}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">Pay at the counter using UPI.</p>
          )}
          <p className="mt-2 text-sm text-muted">
            No online payment capture yet. Complete UPI at the counter or to this ID, then the
            store will mark it paid.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
          Pay cash at the counter when you collect your order.
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">Status</h2>
        {status === "cancelled" ? (
          <p className="mt-2 text-sm text-danger">This order was cancelled.</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2">
            {CUSTOMER_STATUS_STEPS.map((step, index) => (
              <StatusStep
                key={step}
                step={step}
                state={
                  index < currentIndex ? "done" : index === currentIndex ? "current" : "todo"
                }
              />
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Items</h2>
        {data.items.length === 0 ? (
          <p className="text-sm text-danger">No items were saved on this order.</p>
        ) : (
          data.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity} × {item.item_name}
              </span>
              <span>{formatInr(item.total_amount)}</span>
            </div>
          ))
        )}
        {data.order.notes ? (
          <p className="mt-2 text-sm text-muted">Note: {data.order.notes}</p>
        ) : null}
      </section>

      <Link href={`/s/${slug}`} className="text-center text-sm font-medium text-accent">
        Order something else
      </Link>
    </div>
  );
}

function StatusStep({
  step,
  state,
}: {
  step: OrderStatus;
  state: "done" | "current" | "todo";
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
          state === "done"
            ? "bg-success text-white"
            : state === "current"
              ? "bg-accent text-accent-foreground"
              : "bg-background text-muted"
        }`}
      >
        {state === "done" ? "✓" : state === "current" ? "●" : "○"}
      </span>
      <span className={state === "todo" ? "text-muted" : "font-medium"}>
        {CUSTOMER_STATUS_LABELS[step]}
      </span>
    </li>
  );
}
