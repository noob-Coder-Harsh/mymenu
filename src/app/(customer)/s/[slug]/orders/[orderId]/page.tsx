import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOrder, getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { formatInr } from "@/lib/money";
import { OrderStatusLive } from "./order-status-live";

export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const catalog = await getPublicStoreBySlug(slug);
  if (!catalog) {
    notFound();
  }

  const data = await getPublicOrder(catalog.store.id, orderId);
  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-8">
      <OrderStatusLive
        slug={slug}
        orderId={orderId}
        upiId={catalog.store.upi_id}
        initial={{
          order_number: data.order.order_number,
          order_status: data.order.order_status,
          payment_method: data.order.payment_method,
          payment_status: data.order.payment_status,
          is_takeaway: data.order.is_takeaway === true,
          total_amount: data.order.total_amount,
        }}
      />

      <section className="customer-card flex flex-col gap-2.5 p-4">
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
          Items
        </h2>
        {data.items.length === 0 ? (
          <p className="text-sm text-danger">No items were saved on this order.</p>
        ) : (
          data.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="font-semibold">{item.quantity} ×</span> {item.item_name}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatInr(item.total_amount)}
              </span>
            </div>
          ))
        )}
        {data.order.notes ? (
          <p className="font-script mt-1 border-t border-dashed border-border pt-2 text-[15px] text-muted">
            Note: {data.order.notes}
          </p>
        ) : null}
      </section>

      <Link href={`/s/${slug}`} className="customer-link text-center">
        Order something else
      </Link>
    </div>
  );
}
