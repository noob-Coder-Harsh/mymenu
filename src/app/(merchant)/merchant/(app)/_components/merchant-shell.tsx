"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  MERCHANT_BOTTOM_NAV,
  MERCHANT_NAV,
  PRODUCT_NAME,
} from "@/lib/constants";
import {
  IconBack,
  IconBook,
  IconChart,
  IconClose,
  IconHome,
  IconMenu,
  IconOrders,
  IconStore,
} from "./icons";

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Primary app sections — hamburger. Nested screens — back. */
function isPrimaryScreen(pathname: string) {
  if (pathname === "/merchant") {
    return true;
  }
  return (
    MERCHANT_NAV.some((item) => !item.exact && pathname === item.href) ||
    pathname === "/merchant/account" ||
    pathname === "/merchant/settings"
  );
}

function titleForPath(pathname: string) {
  if (pathname === "/merchant") {
    return "Home";
  }
  if (pathname.startsWith("/merchant/orders/")) {
    return "Order";
  }
  if (pathname === "/merchant/orders") {
    return "Orders";
  }
  if (pathname === "/merchant/reports") {
    return "Reports";
  }
  if (pathname === "/merchant/counter") {
    return "New order";
  }
  if (pathname.startsWith("/merchant/menu")) {
    return "Menu";
  }
  if (pathname.startsWith("/merchant/store")) {
    return "Store";
  }
  if (pathname.startsWith("/merchant/account")) {
    return "Account";
  }
  if (pathname.startsWith("/merchant/settings")) {
    return "Settings";
  }
  return PRODUCT_NAME;
}

const NAV_ICONS: Record<(typeof MERCHANT_NAV)[number]["href"], typeof IconHome> = {
  "/merchant": IconHome,
  "/merchant/orders": IconOrders,
  "/merchant/reports": IconChart,
  "/merchant/menu": IconBook,
  "/merchant/store": IconStore,
};

const BOTTOM_ICONS: Record<
  (typeof MERCHANT_BOTTOM_NAV)[number]["href"],
  typeof IconHome
> = {
  "/merchant": IconHome,
  "/merchant/orders": IconOrders,
  "/merchant/menu": IconBook,
  "/merchant/store": IconStore,
};

export function MerchantShell({
  storeName,
  isOpen,
  children,
}: {
  storeName: string;
  isOpen: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const primary = isPrimaryScreen(pathname);
  const title = titleForPath(pathname);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-2 px-3">
          {primary ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground"
              aria-label="Open menu"
            >
              <IconMenu className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground"
              aria-label="Go back"
            >
              <IconBack className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold tracking-tight">{title}</p>
          </div>
          {pathname !== "/merchant/counter" ? (
            <Link
              href="/merchant/counter"
              className="flex h-9 shrink-0 items-center rounded-xl bg-accent px-3 text-sm font-semibold text-accent-foreground"
            >
              + New
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-6">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="mx-auto grid h-[3.85rem] max-w-3xl grid-cols-4">
          {MERCHANT_BOTTOM_NAV.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const Icon = BOTTOM_ICONS[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer so content clears the bottom bar + home indicator */}
      <div
        className="shrink-0"
        style={{ height: "calc(3.85rem + env(safe-area-inset-bottom, 0px))" }}
        aria-hidden
      />

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-start">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative z-10 flex h-full w-[min(20rem,86vw)] flex-col border-r border-border bg-surface shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{PRODUCT_NAME}</p>
                <p className="truncate text-xs text-muted">{storeName}</p>
                <p
                  className={`mt-1 text-xs font-medium ${
                    isOpen ? "text-success" : "text-muted"
                  }`}
                >
                  {isOpen ? "Store open" : "Store closed"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground"
                aria-label="Close menu"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
              {MERCHANT_NAV.map((item) => {
                const active = isActive(pathname, item.href, item.exact);
                const Icon = NAV_ICONS[item.href];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium ${
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
              <div className="my-2 border-t border-border" />
              <Link
                href="/merchant/settings"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-background"
              >
                Settings
              </Link>
              <Link
                href="/merchant/account"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-background"
              >
                Account
              </Link>
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
