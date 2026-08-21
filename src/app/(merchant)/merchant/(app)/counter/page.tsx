import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getStoreMenu } from "@/lib/menu/queries";
import { CounterOrderPage } from "./_components/counter-order-page";

export const dynamic = "force-dynamic";

export default async function MerchantCounterPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const menu = await getStoreMenu(context.store.id);

  return (
    <CounterOrderPage categories={menu.categories} items={menu.items} />
  );
}
