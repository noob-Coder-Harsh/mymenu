import type { ReactNode } from "react";
import { PRODUCT_NAME } from "@/lib/constants";

export default function CustomerStoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col bg-surface">
      <header className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium tracking-wide text-muted">
          {PRODUCT_NAME}
        </p>
      </header>
      <main className="flex flex-1 flex-col px-4 py-5">{children}</main>
    </div>
  );
}
