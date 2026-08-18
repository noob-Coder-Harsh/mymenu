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
    <div className="flex flex-1 flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Checkout</h1>
        <Link href={`/s/${slug}/cart`} className="text-sm font-medium text-accent">
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
