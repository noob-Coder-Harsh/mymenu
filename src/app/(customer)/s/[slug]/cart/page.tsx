import { notFound } from "next/navigation";
import { getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { CartView } from "./cart-view";

export default async function CustomerCartPage({
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
    <div className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-2">
      <CartView slug={slug} items={catalog.items} storeOpen={catalog.store.is_open} />
    </div>
  );
}
