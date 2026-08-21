import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { OrderDetailClient } from "../_components/order-detail-client";

export const dynamic = "force-dynamic";

export default async function MerchantOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const { orderId } = await params;

  return (
    <OrderDetailClient
      orderId={orderId}
      storeName={context.store.name}
      storePhone={context.store.phone}
    />
  );
}
