import Link from "next/link";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { formatPhoneDisplay } from "@/lib/phone";
import { getStoreSettings } from "@/lib/stores/queries";
import { StoreQrPanel } from "@/components/qr/store-qr-panel";
import { CopyLinkButton } from "./_components/copy-link-button";
import { StoreOpenToggle } from "./_components/store-open-toggle";

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <p className="text-sm text-muted">{label}</p>
      <p className="max-w-[60%] text-right text-sm font-medium">{value}</p>
    </div>
  );
}

export default async function MerchantStorePage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const settings = await getStoreSettings(context.store.id);
  const store = context.store;
  const publicPath = `/s/${store.slug}`;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Store</h1>
          <p className="text-sm text-muted">What customers see and how orders work</p>
        </div>
        <Link
          href="/merchant/store/edit"
          className="flex h-10 shrink-0 items-center rounded-2xl bg-accent px-4 text-sm font-medium text-accent-foreground"
        >
          Edit
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="bg-gradient-to-br from-accent/15 via-surface to-background px-4 pb-5 pt-5">
          <div className="flex items-start gap-3">
            {store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logo_url}
                alt=""
                className="h-16 w-16 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-xl font-semibold text-accent-foreground">
                {store.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{store.name}</h2>
                  <p className="mt-0.5 text-xs text-muted">/{store.slug}</p>
                </div>
                <StoreOpenToggle isOpen={store.is_open} />
              </div>
              {store.description ? (
                <p className="mt-2 text-sm leading-5 text-muted">{store.description}</p>
              ) : (
                <p className="mt-2 text-sm text-muted">No description yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Customer menu link</p>
              <p className="truncate text-sm font-medium">{publicPath}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <CopyLinkButton value={publicPath} />
              <Link
                href={publicPath}
                target="_blank"
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-accent"
              >
                Open
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface px-4 py-4">
        <StoreQrPanel storeName={store.name} slug={store.slug} />
      </div>

      <div className="rounded-3xl border border-border bg-surface px-4 py-2">
        <h3 className="pt-2 text-sm font-semibold">Store details</h3>
        <SettingRow
          label="Phone"
          value={store.phone ? formatPhoneDisplay(store.phone) : "Not set"}
        />
        <SettingRow label="UPI ID" value={store.upi_id || "Not set"} />
        <SettingRow
          label="Status"
          value={store.is_open ? "Open for orders" : "Closed"}
        />
      </div>

      <div className="rounded-3xl border border-border bg-surface px-4 py-2">
        <div className="flex items-center justify-between gap-2 pt-2">
          <h3 className="text-sm font-semibold">Order settings</h3>
          <Link href="/merchant/store/edit#settings" className="text-xs font-medium text-accent">
            Change
          </Link>
        </div>
        {settings ? (
          <>
            <SettingRow label="Currency" value={settings.currency} />
            <SettingRow label="Order prefix" value={settings.order_prefix} />
            <SettingRow
              label="Customer phone"
              value={settings.customer_phone_required ? "Required" : "Optional"}
            />
            <SettingRow
              label="Order alerts"
              value={settings.order_notifications_enabled ? "On" : "Off"}
            />
            <SettingRow
              label="Auto-accept orders"
              value={settings.auto_accept_orders ? "On" : "Off"}
            />
          </>
        ) : (
          <p className="py-3 text-sm text-muted">Settings not found</p>
        )}
      </div>

      <Link
        href="/merchant/store/edit"
        className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium"
      >
        Edit store & settings
      </Link>
    </section>
  );
}
