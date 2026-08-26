import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getStoreMenu } from "@/lib/menu/queries";
import { MerchantPageLoading } from "../_components/merchant-page-loading";
import { MenuBoard } from "./_components/menu-board";

export default async function MerchantMenuPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const { categories, items } = await getStoreMenu(context.store.id);

  return (
    <Suspense fallback={<MerchantPageLoading />}>
      <MenuBoard categories={categories} items={items} />
    </Suspense>
  );
}
