import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { PRODUCT_NAME } from "@/lib/constants";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const context = await getMerchantContext();
  if (!context) {
    redirect("/merchant/login");
  }
  if (context.store) {
    redirect("/merchant");
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-accent">{PRODUCT_NAME}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Create your store</h1>
        <p className="text-sm leading-6 text-muted">
          This is the name customers see on your QR menu.
        </p>
      </div>
      <OnboardingForm defaultPhone={context.user.phone} />
    </main>
  );
}
