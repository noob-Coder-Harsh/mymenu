import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { AccountForm } from "./account-form";

export default async function MerchantAccountPage() {
  const context = await getMerchantContext();
  if (!context) {
    redirect("/merchant/login");
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted">Your merchant profile.</p>
      </div>
      <AccountForm name={context.user.name} phone={context.user.phone} />
    </section>
  );
}
