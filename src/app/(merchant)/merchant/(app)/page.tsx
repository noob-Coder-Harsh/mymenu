import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { toHomeOrder } from "@/lib/orders/home-order";
import { getActiveOpsOrders, getDashboardStats } from "@/lib/orders/queries";
import { HomeOps } from "./_components/home-ops";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const [stats, active] = await Promise.all([
    getDashboardStats(context.store.id),
    getActiveOpsOrders(context.store.id),
  ]);

  return (
    <HomeOps
      storeName={context.store.name}
      isOpen={context.store.is_open}
      todayCount={stats.todayCount}
      todaySales={stats.todaySales}
      newCustomersToday={stats.newCustomersToday}
      orders={active.map(toHomeOrder)}
    />
  );
}
