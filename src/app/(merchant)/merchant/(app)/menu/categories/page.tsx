import Link from "next/link";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getStoreMenu } from "@/lib/menu/queries";
import { CategoryManager } from "./category-manager";

export default async function MerchantCategoriesPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const { categories } = await getStoreMenu(context.store.id);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted">This order is what customers see.</p>
        </div>
        <Link href="/merchant/menu" className="text-sm font-medium text-accent">
          Back
        </Link>
      </div>
      <CategoryManager categories={categories} />
    </section>
  );
}
