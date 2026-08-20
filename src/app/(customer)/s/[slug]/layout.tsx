import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Itim, Montserrat } from "next/font/google";
import { getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { PRODUCT_NAME } from "@/lib/constants";
import { CartProvider } from "./_components/cart-provider";
import { HeaderCartButton } from "./_components/cart-buttons";

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
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-[#fffdf9]/85 px-4 py-2.5 backdrop-blur-md">
          <div className="min-w-0 flex-1">
            {catalog ? (
              <Link
                href={`/s/${slug}`}
                className="block truncate text-[15px] font-semibold tracking-tight"
              >
                {catalog.store.name}
              </Link>
            ) : (
              <p className="text-[15px] font-semibold">Store</p>
            )}
            {catalog ? (
              <p
                className={`mt-0.5 flex items-center gap-1.5 text-[11px] font-medium ${
                  catalog.store.is_open ? "text-success" : "text-danger"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    catalog.store.is_open ? "bg-success" : "bg-danger"
                  }`}
                  aria-hidden
                />
                {catalog.store.is_open ? "Open" : "Closed"}
              </p>
            ) : null}
          </div>
          <HeaderCartButton slug={slug} />
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </CartProvider>
    </div>
  );
}
