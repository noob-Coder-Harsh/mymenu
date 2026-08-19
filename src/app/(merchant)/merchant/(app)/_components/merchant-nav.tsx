"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MERCHANT_NAV, PRODUCT_NAME } from "@/lib/constants";
import {
  IconBook,
  IconHome,
  IconOrders,
  IconStore,
} from "./icons";

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const NAV_ICONS = {
  "/merchant": IconHome,
  "/merchant/orders": IconOrders,
  "/merchant/menu": IconBook,
  "/merchant/store": IconStore,
} as const;

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
            const Icon = NAV_ICONS[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-background"
                }`}
              >
                <Icon className="h-4 w-4" />
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
          const Icon = NAV_ICONS[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-[3.85rem] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
