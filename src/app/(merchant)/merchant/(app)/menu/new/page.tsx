import Link from "next/link";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getStoreMenu } from "@/lib/menu/queries";
import { ItemForm } from "../_components/item-form";

export default async function NewMenuItemPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const { categories } = await getStoreMenu(context.store.id);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Add item</h1>
        <Link href="/merchant/menu" className="text-sm font-medium text-accent">
          Cancel
        </Link>
      </div>
      <ItemForm categories={categories} />
    </section>
  );
}
