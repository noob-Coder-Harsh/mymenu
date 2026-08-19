import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOrder, getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { formatInr } from "@/lib/money";
import { OrderStatusLive } from "./order-status-live";

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

      <OrderStatusLive
        slug={slug}
        orderId={orderId}
        upiId={catalog.store.upi_id}
        initial={{
          order_number: data.order.order_number,
          order_status: data.order.order_status,
          payment_method: data.order.payment_method,
          payment_status: data.order.payment_status,
          total_amount: data.order.total_amount,
        }}
      />

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
