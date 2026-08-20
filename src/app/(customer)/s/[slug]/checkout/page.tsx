import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { CheckoutForm } from "./checkout-form";

export default async function CustomerCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getPublicStoreBySlug(slug);
  if (!catalog) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-script text-[15px] text-muted">One last step</p>
          <h1 className="text-xl font-bold tracking-tight">Checkout</h1>
        </div>
        <Link href={`/s/${slug}/cart`} className="customer-link pb-0.5">
          Cart
        </Link>
      </div>
      <CheckoutForm
        slug={slug}
        items={catalog.items}
        storeOpen={catalog.store.is_open}
        phoneRequired={catalog.settings.customer_phone_required}
        upiId={catalog.store.upi_id}
      />
    </div>
  );
}
