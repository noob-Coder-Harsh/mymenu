import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { MerchantNav } from "./_components/merchant-nav";

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
    <div className="flex min-h-full flex-1 bg-background">
      <MerchantNav storeName={context.store.name} isOpen={context.store.is_open} />
      <div className="flex min-w-0 flex-1 flex-col pb-[4.4rem] md:pb-0">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>
      </div>
    </div>
  );
}
