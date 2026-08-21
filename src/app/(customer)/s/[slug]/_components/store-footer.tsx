"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StoreFooter({
  slug,
  storeName,
}: {
  slug: string;
  storeName: string | null;
}) {
  const pathname = usePathname();
  const base = `/s/${slug}`;
  const stickyBar =
    pathname === base ||
    pathname === `${base}/` ||
    pathname === `${base}/checkout` ||
    pathname.startsWith(`${base}/checkout/`);

  return (
    <footer
      className={`px-4 pt-6 text-center ${
        stickyBar
          ? "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
          : "pb-[max(1rem,env(safe-area-inset-bottom))]"
      }`}
    >
      <Link href="/" className="font-script text-sm text-muted/80">
        Powered by FoodBaba
      </Link>
      {storeName ? (
        <p className="mt-1 text-xs font-medium text-muted">{storeName}</p>
      ) : null}
    </footer>
  );
}
