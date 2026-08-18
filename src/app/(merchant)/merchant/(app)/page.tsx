import Link from "next/link";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { StoreOpenToggle } from "./_components/store-open-toggle";

export default async function MerchantDashboardPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted">Hello</p>
          <h1 className="text-2xl font-semibold tracking-tight">{context.user.name}</h1>
          <p className="text-sm text-muted">{context.store.name}</p>
        </div>
        <Link href="/merchant/account" className="text-sm font-medium text-accent">
          Account
        </Link>
      </div>

      <StoreOpenToggle isOpen={context.store.is_open} />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Today</p>
          <p className="text-xl font-semibold">0</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Sales</p>
          <p className="text-xl font-semibold">₹0</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Pending</p>
          <p className="text-xl font-semibold">0</p>
        </div>
      </div>
      <p className="text-xs text-muted">Order counts land in I4.</p>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/merchant/menu/new"
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium"
        >
          Add item
        </Link>
        <Link
          href="/merchant/orders"
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium"
        >
          View orders
        </Link>
      </div>
    </section>
  );
}
