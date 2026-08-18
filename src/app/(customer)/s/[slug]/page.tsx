import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { CartBar } from "./_components/cart-bar";
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
      <div className="flex flex-1 flex-col gap-5 px-4 py-5">
        <div className="flex items-start gap-3">
          {catalog.store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={catalog.store.logo_url}
              alt=""
              className="h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-lg">
              {catalog.store.name.slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{catalog.store.name}</h1>
            {catalog.store.description ? (
              <p className="mt-1 text-sm text-muted">{catalog.store.description}</p>
            ) : null}
            <p
              className={`mt-1 text-sm font-medium ${
                catalog.store.is_open ? "text-success" : "text-danger"
              }`}
            >
              {catalog.store.is_open ? "Open" : "Closed"}
            </p>
          </div>
        </div>

        {!catalog.store.is_open ? (
          <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            This store is closed. You can browse the menu, but you cannot place an order yet.
          </div>
        ) : null}

        <StoreMenu
          storeOpen={catalog.store.is_open}
          categories={catalog.categories}
          items={catalog.items}
        />
        <p className="pt-2 text-center text-xs text-muted">
          <Link href="/">Powered by FoodBaba</Link>
        </p>
      </div>
      <CartBar slug={slug} items={catalog.items} storeOpen={catalog.store.is_open} />
    </>
  );
}
