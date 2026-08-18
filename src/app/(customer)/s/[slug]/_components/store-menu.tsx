"use client";

import { useMemo, useState } from "react";
import { formatInr } from "@/lib/money";
import type { MenuCategory } from "@/lib/types/database";
import type { MenuItemView } from "@/lib/menu/types";
import { ItemSheet } from "./item-sheet";
import { QuantityStepper } from "./quantity-stepper";

export function StoreMenu({
  storeOpen,
  categories,
  items,
}: {
  storeOpen: boolean;
  categories: MenuCategory[];
  items: MenuItemView[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selected, setSelected] = useState<MenuItemView | null>(null);

  const activeCategoryIds = useMemo(
    () => new Set(categories.map((category) => category.id)),
    [categories],
  );

  const isUncategorized = (item: MenuItemView) =>
    !item.category_id || !activeCategoryIds.has(item.category_id);

  const hasUncategorized = items.some(isUncategorized);

  const visibleItems = useMemo(() => {
    if (activeCategory === "all") {
      return items;
    }
    if (activeCategory === "uncategorized") {
      return items.filter(
        (item) => !item.category_id || !activeCategoryIds.has(item.category_id),
      );
    }
    return items.filter((item) => item.category_id === activeCategory);
  }, [activeCategory, activeCategoryIds, items]);

  const grouped = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        items: visibleItems.filter((item) => item.category_id === category.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, visibleItems]);

  const uncategorized =
    activeCategory === "all" || activeCategory === "uncategorized"
      ? visibleItems.filter(isUncategorized)
      : [];

  return (
    <div className="flex flex-col gap-5">
      {categories.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <CategoryChip
            label="All"
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            />
          ))}
          {hasUncategorized ? (
            <CategoryChip
              label="More"
              active={activeCategory === "uncategorized"}
              onClick={() => setActiveCategory("uncategorized")}
            />
          ) : null}
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted">Menu is being set up. Check back soon.</p>
      ) : null}

      {grouped.map((group) => (
        <section key={group.category.id} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">{group.category.name}</h2>
          {group.items.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              storeOpen={storeOpen}
              onOpen={() => setSelected(item)}
            />
          ))}
        </section>
      ))}

      {uncategorized.length > 0 ? (
        <section className="flex flex-col gap-2">
          {grouped.length > 0 ? <h2 className="text-sm font-semibold">More</h2> : null}
          {uncategorized.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              storeOpen={storeOpen}
              onOpen={() => setSelected(item)}
            />
          ))}
        </section>
      ) : null}

      {selected ? (
        <ItemSheet
          item={selected}
          storeOpen={storeOpen}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
        active ? "bg-accent text-accent-foreground" : "bg-background text-muted"
      }`}
    >
      {label}
    </button>
  );
}

function MenuCard({
  item,
  storeOpen,
  onOpen,
}: {
  item: MenuItemView;
  storeOpen: boolean;
  onOpen: () => void;
}) {
  return (
    <article className="flex gap-3 rounded-2xl border border-border bg-surface p-3">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 gap-3 text-left">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt=""
            className="h-16 w-16 rounded-xl object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-background" />
        )}
        <div className="min-w-0">
          <h3 className="truncate font-medium">{item.name}</h3>
          {item.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted">
              {item.description}
            </p>
          ) : null}
          <p className="mt-1 text-sm font-semibold">{formatInr(item.price)}</p>
        </div>
      </button>
      <div className="flex items-center">
        <QuantityStepper item={item} disabled={!storeOpen} />
      </div>
    </article>
  );
}
