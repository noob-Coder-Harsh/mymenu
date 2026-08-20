import Link from "next/link";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getStoreSettings } from "@/lib/stores/queries";
import { StoreEditForm } from "./store-edit-form";

export default async function MerchantStoreEditPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const settings = await getStoreSettings(context.store.id);
  if (!settings) {
    redirect("/merchant/store");
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit store</h1>
          <p className="text-sm text-muted">Profile and order settings</p>
        </div>
        <Link href="/merchant/store" className="text-sm font-medium text-accent">
          Back
        </Link>
      </div>
      <StoreEditForm store={context.store} settings={settings} />
    </section>
  );
}
