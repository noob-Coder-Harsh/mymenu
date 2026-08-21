"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { MenuCategory } from "@/lib/types/database";
import type { MenuItemView } from "@/lib/menu/types";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { CategoryManager } from "../categories/category-manager";
import { ItemForm } from "./item-form";
import { MenuItemRow } from "./menu-item-row";

type FilterId = "all" | "uncategorized" | string;

export function MenuBoard({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItemView[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterId>("all");
  const [manageOpen, setManageOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [itemSheet, setItemSheet] = useState<"new" | MenuItemView | null>(null);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.is_active),
    [categories],
  );

  const uncategorizedCount = items.filter((item) => !item.category_id).length;

  const visibleItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }
    if (filter === "uncategorized") {
      return items.filter((item) => !item.category_id);
    }
    return items.filter((item) => item.category_id === filter);
  }, [filter, items]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  function closeItemSheet() {
    setItemSheet(null);
  }

  function onItemSaved() {
    setItemSheet(null);
    refresh();
  }

  async function createCategory() {
    setSheetError(null);
    const name = newCategoryName.trim();
    if (name.length < 2) {
      setSheetError("Enter a category name");
      return;
    }
    const response = await fetch("/api/merchant/categories", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await response.json()) as {
      error?: string;
      category?: MenuCategory;
    };
    if (!response.ok || !data.category) {
      setSheetError(data.error || "Could not add category");
      return;
    }
    setNewCategoryName("");
    setAddCategoryOpen(false);
    setFilter(data.category.id);
    refresh();
  }

  const editingItem = itemSheet && itemSheet !== "new" ? itemSheet : undefined;
  const itemSheetOpen = itemSheet !== null;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">My Menu</h1>
          <p className="text-sm text-muted">Manage what your customers see</p>
        </div>
        <button
          type="button"
          onClick={() => setItemSheet("new")}
          className="flex h-10 shrink-0 items-center rounded-2xl bg-accent px-3.5 text-sm font-medium text-accent-foreground"
        >
          + Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3 py-3 text-left sm:px-4"
        >
          <div>
            <p className="text-xs text-muted">Categories</p>
            <p className="text-lg font-semibold">{categories.length}</p>
          </div>
          <span className="text-muted" aria-hidden>
            ›
          </span>
        </button>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3 py-3 sm:px-4">
          <div>
            <p className="text-xs text-muted">Total Items</p>
            <p className="text-lg font-semibold">{items.length}</p>
          </div>
          <span className="text-muted" aria-hidden>
            ›
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Categories</h2>
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="text-sm font-medium text-accent"
          >
            Manage
          </button>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <Chip
            label="All Items"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {activeCategories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              active={filter === category.id}
              onClick={() => setFilter(category.id)}
            />
          ))}
          {uncategorizedCount > 0 ? (
            <Chip
              label="Uncategorized"
              active={filter === "uncategorized"}
              onClick={() => setFilter("uncategorized")}
            />
          ) : null}
          <button
            type="button"
            onClick={() => {
              setSheetError(null);
              setAddCategoryOpen(true);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-accent text-lg font-medium text-accent"
            aria-label="Add category"
          >
            +
          </button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Tap Available to show / hide an item. Tap Edit to change prices or photo.
      </p>

      {visibleItems.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          {items.length === 0
            ? "No items yet. Add your first coffee or snack."
            : "No items in this category."}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visibleItems.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              onEdit={(next) => setItemSheet(next)}
            />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-foreground">
        Tip: Add items with different prices like Small, Medium, Large — turn on
        “Different prices?” when editing.
      </div>

      <BottomSheet
        open={itemSheetOpen}
        title={editingItem ? "Edit item" : "Add item"}
        onClose={closeItemSheet}
        size="form"
      >
        <ItemForm
          key={editingItem?.id ?? "new-item"}
          categories={categories}
          item={editingItem}
          onSaved={onItemSaved}
          onCancel={closeItemSheet}
        />
      </BottomSheet>

      <BottomSheet
        open={addCategoryOpen}
        title="Add category"
        onClose={() => setAddCategoryOpen(false)}
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Category name
            <input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Coffee, Momos, Snacks…"
              className="h-12 rounded-2xl border border-border bg-background px-4 text-base outline-none focus:border-accent"
              autoFocus
            />
          </label>
          {sheetError ? <p className="text-sm text-danger">{sheetError}</p> : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => void createCategory()}
            className="flex h-12 items-center justify-center rounded-2xl bg-accent text-base font-medium text-accent-foreground disabled:opacity-60"
          >
            Save category
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={manageOpen}
        title="Manage categories"
        onClose={() => setManageOpen(false)}
      >
        <CategoryManager categories={categories} />
      </BottomSheet>
    </section>
  );
}

function Chip({
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
      className={`h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
