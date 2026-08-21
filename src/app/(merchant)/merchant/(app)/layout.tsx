import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { MerchantOrderProvider } from "./_components/merchant-order-provider";
import { MerchantShell } from "./_components/merchant-shell";

export default async function MerchantAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await getMerchantContext();
  if (!context) {
    redirect("/merchant/login");
  }
  if (!context.store) {
    redirect("/merchant/onboarding");
  }

  return (
    <MerchantOrderProvider>
      <MerchantShell
        storeName={context.store.name}
        isOpen={context.store.is_open}
      >
        {children}
      </MerchantShell>
    </MerchantOrderProvider>
  );
}
