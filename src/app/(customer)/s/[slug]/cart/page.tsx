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
    <div className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-script text-[15px] text-muted">Almost there</p>
          <h1 className="text-xl font-bold tracking-tight">Your order</h1>
        </div>
        <Link href={`/s/${slug}`} className="customer-link pb-0.5">
          Menu
        </Link>
      </div>
      <CartView slug={slug} items={catalog.items} storeOpen={catalog.store.is_open} />
    </div>
  );
}
