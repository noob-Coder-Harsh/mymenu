import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
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
      <OnboardingForm defaultPhone={context.user.phone} />
    </main>
  );
}
