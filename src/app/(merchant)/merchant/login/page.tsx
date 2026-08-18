import { Suspense } from "react";
import { PRODUCT_NAME } from "@/lib/constants";
import { PhoneLoginForm } from "./phone-login-form";

export default function MerchantLoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-accent">{PRODUCT_NAME}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Merchant login</h1>
        <p className="text-sm leading-6 text-muted">
          Use your phone number. We’ll send a one-time code.
        </p>
        <p className="text-xs text-muted">
          Firebase project: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <PhoneLoginForm />
      </Suspense>
    </main>
  );
}
