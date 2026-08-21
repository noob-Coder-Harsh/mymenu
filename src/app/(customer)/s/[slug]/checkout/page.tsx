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
    <div className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-2">
      <CheckoutForm
        slug={slug}
        items={catalog.items}
        storeOpen={catalog.store.is_open}
        phoneRequired={catalog.settings.customer_phone_required}
      />
    </div>
  );
}
