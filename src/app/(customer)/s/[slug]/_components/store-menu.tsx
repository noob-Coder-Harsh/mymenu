"use client";

import { useMemo, useState } from "react";
import { formatInr } from "@/lib/money";
import type { MenuCategory } from "@/lib/types/database";
import {
  displayPrice,
  hasMultiplePrices,
  type MenuItemView,
} from "@/lib/menu/types";
import { useCart } from "./cart-provider";
import { ItemSheet } from "./item-sheet";
import { QuantityStepper } from "./quantity-stepper";

export function StoreMenu({
  storeOpen,
  categories,
  items,
  tagline,
}: {
  storeOpen: boolean;
  categories: MenuCategory[];
  items: MenuItemView[];
  tagline?: string | null;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selected, setSelected] = useState<MenuItemView | null>(null);

  const activeCategoryIds = useMemo(
    () => new Set(categories.map((category) => category.id)),
    [categories],
  );

  const visibleItems = useMemo(() => {
    if (activeCategory === "all") {
      return items;
    }
    return items.filter((item) => item.category_id === activeCategory);
  }, [activeCategory, items]);

  const grouped = useMemo(() => {
    type Section = { id: string; title: string | null; items: MenuItemView[] };
    const looseOf = (list: MenuItemView[]) =>
      list.filter(
        (item) => !item.category_id || !activeCategoryIds.has(item.category_id),
      );

    if (activeCategory !== "all") {
      const category = categories.find((entry) => entry.id === activeCategory);
      if (!category) {
        return [] as Section[];
      }
      return [{ id: category.id, title: category.name, items: visibleItems }];
    }

    const sections: Section[] = categories
      .map((category) => ({
        id: category.id,
        title: category.name,
        items: visibleItems.filter((item) => item.category_id === category.id),
      }))
      .filter((group) => group.items.length > 0);

    const loose = looseOf(visibleItems);
    if (loose.length > 0) {
      sections.push({ id: "__loose__", title: null, items: loose });
    }
    return sections;
  }, [activeCategory, activeCategoryIds, categories, visibleItems]);

  const showChips = categories.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {tagline ? (
        <p className="font-script px-0.5 text-[17px] leading-snug text-muted">
          {tagline}
        </p>
      ) : null}

      {showChips ? (
        <div className="sticky top-[3.35rem] z-[5] -mx-4 bg-[linear-gradient(180deg,rgba(250,246,241,0.96)_0%,rgba(250,246,241,0.88)_70%,transparent_100%)] px-4 py-2 backdrop-blur-[2px]">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="font-script text-base text-muted">
          Menu is being set up. Check back soon.
        </p>
      ) : (
        <div className="mb-2">
          <div className="menu-receipt overflow-hidden pb-1">
            {grouped.map((group, groupIndex) => (
              <section
                key={group.id}
                className={groupIndex > 0 ? "border-t border-dashed border-border" : ""}
              >
                {group.title ? (
                  <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2">
                    <span className="menu-section-label">
                      <span className="text-[11px] font-bold tracking-[0.16em] uppercase">
                        {group.title}
                      </span>
                    </span>
                    <span
                      className="h-px flex-1 border-t border-dashed border-border"
                      aria-hidden
                    />
                  </div>
                ) : (
                  <div className="h-2" />
                )}
                <ul className="flex flex-col gap-2 px-3 pb-3">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <MenuRow
                        item={item}
                        storeOpen={storeOpen}
                        onOpen={() => setSelected(item)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <svg
            className="menu-receipt-edge"
            viewBox="0 0 360 12"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M0 0h360v2L354 12 348 2 342 12 336 2 330 12 324 2 318 12 312 2 306 12 300 2 294 12 288 2 282 12 276 2 270 12 264 2 258 12 252 2 246 12 240 2 234 12 228 2 222 12 216 2 210 12 204 2 198 12 192 2 186 12 180 2 174 12 168 2 162 12 156 2 150 12 144 2 138 12 132 2 126 12 120 2 114 12 108 2 102 12 96 2 90 12 84 2 78 12 72 2 66 12 60 2 54 12 48 2 42 12 36 2 30 12 24 2 18 12 12 2 6 12 0 2z"
            />
          </svg>
        </div>
      )}

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
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        active
          ? "bg-accent text-accent-foreground shadow-sm shadow-accent/25"
          : "border border-border bg-surface text-foreground/80"
      }`}
    >
      {label}
    </button>
  );
}

function MenuRow({
  item,
  storeOpen,
  onOpen,
}: {
  item: MenuItemView;
  storeOpen: boolean;
  onOpen: () => void;
}) {
  const { quantityFor } = useCart();
  const price = displayPrice(item);
  const multi = hasMultiplePrices(item);
  const singleVariant =
    !multi
      ? (item.variants.find((variant) => variant.is_available) ?? item.variants[0])
      : null;

  const multiQty = multi
    ? item.variants.reduce((sum, variant) => sum + quantityFor(variant.id), 0)
    : 0;

  const unavailable =
    !item.is_available || (!multi && !singleVariant?.is_available);

  const rowClass =
    "flex w-full items-center gap-2 rounded-xl border border-border/90 bg-[#fffefb] px-3 py-2.5 text-left shadow-[0_1px_0_rgba(44,24,16,0.03)]";

  const nameBlock = (
    <div className="min-w-0 max-w-[52%] shrink">
      <p className="truncate text-[15px] font-semibold leading-5 tracking-tight">
        {item.name}
      </p>
      {item.description ? (
        <p className="font-script mt-0.5 line-clamp-1 text-[15px] leading-5 text-muted">
          {item.description}
        </p>
      ) : unavailable ? (
        <p className="mt-0.5 text-xs text-muted">Sold out</p>
      ) : null}
    </div>
  );

  const priceBlock = (
    <div className="flex shrink-0 items-baseline gap-1 tabular-nums">
      {multi && price !== null ? (
        <span className="font-script text-[13px] text-muted">from</span>
      ) : null}
      <span className="text-sm font-bold text-foreground">
        {price === null ? "—" : formatInr(price)}
      </span>
    </div>
  );

  if (multi) {
    return (
      <button
        type="button"
        onClick={onOpen}
        disabled={unavailable}
        className={`${rowClass} disabled:opacity-50`}
      >
        {nameBlock}
        <span
          className="mx-1 h-px min-w-3 flex-1 border-t border-dashed border-border"
          aria-hidden
        />
        {priceBlock}
        {multiQty > 0 ? (
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">
            {multiQty}
          </span>
        ) : (
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[13px] text-accent-foreground"
            aria-hidden
          >
            ›
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={rowClass}>
      {nameBlock}
      <span
        className="mx-1 h-px min-w-3 flex-1 border-t border-dashed border-border"
        aria-hidden
      />
      {priceBlock}
      {singleVariant ? (
        <QuantityStepper
          variantId={singleVariant.id}
          available={item.is_available && singleVariant.is_available}
          disabled={!storeOpen}
          compact
        />
      ) : (
        <span className="text-xs text-muted">—</span>
      )}
    </div>
  );
}
