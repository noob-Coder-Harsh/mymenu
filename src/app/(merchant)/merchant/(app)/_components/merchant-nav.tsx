"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MERCHANT_NAV, PRODUCT_NAME } from "@/lib/constants";

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MerchantNav({
  storeName,
  isOpen,
}: {
  storeName: string;
  isOpen: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden border-r border-border bg-surface md:flex md:w-56 md:flex-col">
        <div className="border-b border-border px-4 py-4">
          <p className="text-sm font-semibold">{PRODUCT_NAME}</p>
          <p className="truncate text-xs text-muted">{storeName}</p>
          <p className={`mt-1 text-xs font-medium ${isOpen ? "text-success" : "text-muted"}`}>
            {isOpen ? "Open" : "Closed"}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {MERCHANT_NAV.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-background"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-1 border-t border-border p-3">
          <Link
            href="/merchant/settings"
            className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-background"
          >
            Settings
          </Link>
          <Link
            href="/merchant/account"
            className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-background"
          >
            Account
          </Link>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {MERCHANT_NAV.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-14 items-center justify-center text-xs font-medium ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
