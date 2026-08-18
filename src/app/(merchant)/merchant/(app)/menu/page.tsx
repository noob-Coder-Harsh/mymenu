import Link from "next/link";
import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/auth/merchant";
import { getStoreMenu } from "@/lib/menu/queries";
import { MenuItemRow } from "./_components/menu-item-row";

export default async function MerchantMenuPage() {
  const context = await getMerchantContext();
  if (!context?.store) {
    redirect("/merchant/onboarding");
  }

  const { categories, items } = await getStoreMenu(context.store.id);
  const uncategorized = items.filter((item) => !item.category_id);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Menu</h1>
          <p className="text-sm text-muted">Tap Available when something runs out.</p>
        </div>
        <Link
          href="/merchant/menu/new"
          className="flex h-10 items-center rounded-2xl bg-accent px-4 text-sm font-medium text-accent-foreground"
        >
          Add item
        </Link>
      </div>

      <Link
        href="/merchant/menu/categories"
        className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium"
      >
        Categories ({categories.length})
      </Link>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          No items yet. Add a category, then add your first coffee or snack.
        </p>
      ) : null}

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category_id === category.id);
        return (
          <div key={category.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{category.name}</h2>
              {!category.is_active ? (
                <span className="text-xs text-muted">Hidden</span>
              ) : null}
            </div>
            {categoryItems.length === 0 ? (
              <p className="text-sm text-muted">No items in this category.</p>
            ) : (
              categoryItems.map((item) => <MenuItemRow key={item.id} item={item} />)
            )}
          </div>
        );
      })}

      {uncategorized.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Uncategorized</h2>
          {uncategorized.map((item) => (
            <MenuItemRow key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
