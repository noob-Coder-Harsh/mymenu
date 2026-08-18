import Link from "next/link";
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
    <div className="flex flex-1 flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Your order</h1>
        <Link href={`/s/${slug}`} className="text-sm font-medium text-accent">
          Menu
        </Link>
      </div>
      <CartView slug={slug} items={catalog.items} storeOpen={catalog.store.is_open} />
    </div>
  );
}
