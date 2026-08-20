import { redirect } from "next/navigation";
import { HomeLanding } from "@/components/home/home-landing";
import { MerchantStartProvider } from "@/components/home/merchant-start-link";
import { getMerchantContext } from "@/lib/auth/merchant";

export default async function HomePage() {
  const context = await getMerchantContext();
  if (context) {
    redirect(context.store ? "/merchant" : "/merchant/onboarding");
  }

  return (
    <MerchantStartProvider>
      <HomeLanding />
    </MerchantStartProvider>
  );
}
