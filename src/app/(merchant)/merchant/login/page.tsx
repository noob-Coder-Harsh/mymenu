import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/constants";

export default function MerchantLoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-accent">{PRODUCT_NAME}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Merchant login</h1>
        <p className="text-sm leading-6 text-muted">
          Phone OTP via Firebase Auth lands in I1. This page is the login shell.
        </p>
      </div>
      <Link
        href="/merchant"
        className="flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-medium text-accent-foreground"
      >
        Continue to dashboard shell
      </Link>
    </main>
  );
}
