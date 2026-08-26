import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getActiveOpsOrders } from "@/lib/orders/queries";
import { HomeOps } from "./_components/home-ops";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const active = await getActiveOpsOrders(context.store.id);
  const store = context.store;
  const syncedAt = new Date().toISOString();

  return (
    <HomeOps
      orders={active}
      syncedAt={syncedAt}
      storeName={store.name}
      slug={store.slug}
      isOpen={store.is_open}
      description={store.description}
    />
  );
}
