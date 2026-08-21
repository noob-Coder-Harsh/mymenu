"use client";

import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/constants";

export function HomeStoreFooter({
  storeName,
  slug,
  isOpen,
  description,
}: {
  storeName: string;
  slug: string;
  isOpen: boolean;
  description: string | null;
}) {
  const menuPath = `/s/${slug}`;

  return (
    <footer className="mt-2 flex flex-col gap-3">
      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent/12 via-surface to-background">
        <div className="px-4 pt-4 pb-3">
          <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
            Your store
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{storeName}</p>
          {description ? (
            <p className="mt-1 text-sm leading-snug text-muted">{description}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">Add a short tagline in Store.</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isOpen
                  ? "bg-success/15 text-success"
                  : "bg-background text-muted"
              }`}
            >
              {isOpen ? "Open for orders" : "Closed"}
            </span>
            <span className="rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted">
              /{slug}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-border bg-border">
          <Link
            href="/merchant/reports"
            className="bg-surface/90 px-4 py-3 text-center text-sm font-semibold text-accent"
          >
            Reports
          </Link>
          <Link
            href="/merchant/store"
            className="bg-surface/90 px-4 py-3 text-center text-sm font-semibold text-accent"
          >
            Store & QR
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border/80 px-4 py-3 text-center">
        <p className="text-xs text-muted">
          Customer menu ·{" "}
          <Link href={menuPath} className="font-medium text-accent">
            {menuPath}
          </Link>
        </p>
        <p className="mt-1 font-script text-sm text-muted/80">
          Powered by {PRODUCT_NAME}
        </p>
      </div>
    </footer>
  );
}
