import Link from "next/link";
import { DEMO_STORE_SLUG, PRODUCT_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 py-12">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-wide text-accent">
          {PRODUCT_NAME}
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">
          QR ordering for cafes and carts
        </h1>
        <p className="text-base leading-7 text-muted">
          Put a QR on the table. Customers order. You process. No customer
          accounts.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/merchant/login"
          className="flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-medium text-accent-foreground"
        >
          Merchant login
        </Link>
        <Link
          href={`/s/${DEMO_STORE_SLUG}`}
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface px-5 text-base font-medium"
        >
          Try demo menu
        </Link>
      </div>
    </main>
  );
}
