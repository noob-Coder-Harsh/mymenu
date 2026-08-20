import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { FloatingCartButton } from "./_components/cart-buttons";
import { StoreMenu } from "./_components/store-menu";

export default async function CustomerMenuPage({
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
    <>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-3 pb-28">
        {!catalog.store.is_open ? (
          <p className="rounded-xl border border-border/80 bg-surface/80 px-3 py-2 text-sm text-muted">
            Closed right now — you can browse, but ordering is paused.
          </p>
        ) : null}

        <StoreMenu
          storeOpen={catalog.store.is_open}
          categories={catalog.categories}
          items={catalog.items}
          tagline={catalog.store.description}
        />

        <p className="pt-4 text-center text-xs text-muted">
          <Link href="/" className="font-script text-sm text-muted/80">
            Powered by FoodBaba
          </Link>
        </p>
      </div>
      <FloatingCartButton slug={slug} storeOpen={catalog.store.is_open} />
    </>
  );
}
