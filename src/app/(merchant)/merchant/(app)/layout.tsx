import type { ReactNode } from "react";
import { MerchantNav } from "./_components/merchant-nav";

export default function MerchantAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 bg-background">
      <MerchantNav />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
