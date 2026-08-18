import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { PRODUCT_NAME } from "@/lib/constants";
import { CartProvider } from "./_components/cart-provider";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getPublicStoreBySlug(slug);
  return {
    title: catalog ? `${catalog.store.name} · ${PRODUCT_NAME}` : PRODUCT_NAME,
  };
}

export default async function CustomerStoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getPublicStoreBySlug(slug);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-3">
        <p className="text-xs font-medium tracking-wide text-muted">{PRODUCT_NAME}</p>
        {catalog ? (
          <Link href={`/s/${slug}`} className="text-sm font-semibold">
            {catalog.store.name}
          </Link>
        ) : (
          <p className="text-sm font-semibold">Store</p>
        )}
      </header>
      <CartProvider slug={slug}>
        <div className="flex flex-1 flex-col">{children}</div>
      </CartProvider>
    </div>
  );
}
