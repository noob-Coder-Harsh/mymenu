"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderCartButton } from "./cart-buttons";

type NestedScreen = {
  title: string;
  backHref: string;
};

function resolveNestedScreen(pathname: string, slug: string): NestedScreen | null {
  const base = `/s/${slug}`;
  if (pathname === base || pathname === `${base}/`) {
    return null;
  }
  if (pathname === `${base}/cart` || pathname.startsWith(`${base}/cart/`)) {
    return { title: "Cart", backHref: base };
  }
  if (pathname === `${base}/checkout` || pathname.startsWith(`${base}/checkout/`)) {
    return { title: "Checkout", backHref: base };
  }
  if (pathname.startsWith(`${base}/orders/`)) {
    return { title: "Order", backHref: base };
  }
  return { title: "Back", backHref: base };
}

export function StoreHeader({
  slug,
  isOpen,
}: {
  slug: string;
  isOpen: boolean | null;
}) {
  const pathname = usePathname();
  const nested = resolveNestedScreen(pathname, slug);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/60 bg-[#fffdf9]/85 px-3 py-2.5 backdrop-blur-md sm:px-4">
      {nested ? (
        <>
          <Link
            href={nested.backHref}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-[#fffefb] text-foreground shadow-[0_1px_0_rgba(44,24,16,0.04)]"
            aria-label="Back to menu"
          >
            <BackIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-tight">
              {nested.title}
            </p>
          </div>
        </>
      ) : (
        <div className="min-w-0 flex-1 pl-1">
          <p className="truncate text-[15px] font-semibold tracking-tight">Menu</p>
          {isOpen != null ? (
            <p
              className={`mt-0.5 flex items-center gap-1.5 text-[11px] font-medium ${
                isOpen ? "text-success" : "text-danger"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOpen ? "bg-success" : "bg-danger"
                }`}
                aria-hidden
              />
              {isOpen ? "Open" : "Closed"}
            </p>
          ) : null}
        </div>
      )}
      <HeaderCartButton slug={slug} />
    </header>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
