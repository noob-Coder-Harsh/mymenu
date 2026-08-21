import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Itim, Montserrat } from "next/font/google";
import { getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { PRODUCT_NAME } from "@/lib/constants";
import { CartProvider } from "./_components/cart-provider";
import { StoreFooter } from "./_components/store-footer";
import { StoreHeader } from "./_components/store-header";

const menuSans = Montserrat({
  subsets: ["latin"],
  variable: "--font-menu-sans",
  weight: ["500", "600", "700"],
});

const menuScript = Itim({
  subsets: ["latin"],
  variable: "--font-menu-script",
  weight: "400",
});

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
    <div
      className={`${menuSans.variable} ${menuScript.variable} customer-store mx-auto flex min-h-full w-full max-w-md flex-1 flex-col`}
    >
      <CartProvider slug={slug}>
        <StoreHeader slug={slug} isOpen={catalog?.store.is_open ?? null} />
        <div className="flex flex-1 flex-col">{children}</div>
        <StoreFooter slug={slug} storeName={catalog?.store.name ?? null} />
      </CartProvider>
    </div>
  );
}
