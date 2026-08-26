"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { MenuCategory } from "@/lib/types/database";
import type { MenuItemView } from "@/lib/menu/types";
import { hasMultiplePrices } from "@/lib/menu/types";

type PriceRow = {
  id?: string;
  name: string;
  price: string;
};

const SIZE_PRESETS = ["Small", "Medium", "Large"] as const;

function initialRows(item?: MenuItemView): PriceRow[] {
  if (!item || item.variants.length === 0) {
    return [{ name: "", price: "" }];
  }
  return item.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    price: String(variant.price),
  }));
}

function initialCategoryQuery(categories: MenuCategory[], item?: MenuItemView) {
  if (!item?.category_id) {
    return "";
  }
  return categories.find((category) => category.id === item.category_id)?.name ?? "";
}

export function ItemForm({
  categories,
  item,
  onSaved,
  onCancel,
  formId = "menu-item-form",
  onSavingChange,
}: {
  categories: MenuCategory[];
  item?: MenuItemView;
  onSaved?: () => void;
  onCancel?: () => void;
  formId?: string;
  onSavingChange?: (saving: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [categoryQuery, setCategoryQuery] = useState(() =>
    initialCategoryQuery(categories, item),
  );
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [differentPrices, setDifferentPrices] = useState(
    item ? hasMultiplePrices(item) : false,
  );
  const [priceRows, setPriceRows] = useState<PriceRow[]>(() => initialRows(item));
  const [available, setAvailable] = useState(item?.is_available ?? true);
  const [active, setActive] = useState(item?.is_active ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.image_url ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onSavingChange?.(loading);
  }, [loading, onSavingChange]);

  useEffect(() => {
    return () => onSavingChange?.(false);
  }, [onSavingChange]);

  useEffect(() => {
    if (!image) {
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const categoryMatches = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) {
      return categories.slice(0, 8);
    }
    return categories
      .filter((category) => category.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [categories, categoryQuery]);

  const exactCategory = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) {
      return null;
    }
    return (
      categories.find((category) => category.name.toLowerCase() === query) ?? null
    );
  }, [categories, categoryQuery]);

  const canCreateCategory =
    categoryQuery.trim().length >= 2 && exactCategory === null;

  function setSinglePrice(value: string) {
    setPriceRows([{ ...priceRows[0], name: "", price: value }]);
  }

  function updateRow(index: number, patch: Partial<PriceRow>) {
    setPriceRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setPriceRows((rows) => [...rows, { name: "", price: "" }]);
  }

  function removeRow(index: number) {
    setPriceRows((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));
  }

  function applySizePresets() {
    setPriceRows(
      SIZE_PRESETS.map((label, index) => ({
        id: priceRows[index]?.id,
        name: label,
        price: priceRows[index]?.price ?? "",
      })),
    );
  }

  function toggleDifferentPrices(next: boolean) {
    setDifferentPrices(next);
    if (next) {
      if (priceRows.length === 1 && !priceRows[0]?.name) {
        const first = priceRows[0];
        setPriceRows(
          SIZE_PRESETS.map((label, index) => ({
            id: index === 0 ? first?.id : undefined,
            name: label,
            price: index === 0 ? first?.price ?? "" : "",
          })),
        );
      }
    } else {
      const first = priceRows[0];
      setPriceRows([{ id: first?.id, name: "", price: first?.price ?? "" }]);
    }
  }

  function onCategoryQueryChange(value: string) {
    setCategoryQuery(value);
    setCategoryOpen(true);
    const match = categories.find(
      (category) => category.name.toLowerCase() === value.trim().toLowerCase(),
    );
    setCategoryId(match?.id ?? "");
  }

  function selectCategory(category: MenuCategory) {
    setCategoryId(category.id);
    setCategoryQuery(category.name);
    setCategoryOpen(false);
  }

  function clearCategory() {
    setCategoryId("");
    setCategoryQuery("");
    setCategoryOpen(false);
  }

  async function resolveCategoryId(): Promise<string | null> {
    const query = categoryQuery.trim();
    if (!query) {
      return null;
    }
    if (exactCategory) {
      return exactCategory.id;
    }
    if (categoryId) {
      const selected = categories.find((category) => category.id === categoryId);
      if (selected && selected.name.toLowerCase() === query.toLowerCase()) {
        return selected.id;
      }
    }
    const response = await fetch("/api/merchant/categories", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: query }),
    });
    const data = (await response.json()) as {
      error?: string;
      category?: MenuCategory;
    };
    if (!response.ok || !data.category) {
      throw new Error(data.error || "Could not create category");
    }
    return data.category.id;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (name.trim().length < 2) {
        throw new Error("Enter an item name");
      }
      if (categoryQuery.trim().length < 2) {
        throw new Error("Choose or create a category");
      }

      const resolvedCategoryId = await resolveCategoryId();
      if (!resolvedCategoryId) {
        throw new Error("Choose or create a category");
      }

      const prices = differentPrices
        ? priceRows.map((row) => ({
            id: row.id,
            name: row.name.trim(),
            price: row.price,
          }))
        : [
            {
              id: priceRows[0]?.id,
              name: "",
              price: priceRows[0]?.price ?? "",
            },
          ];

      const response = await fetch(
        item ? `/api/merchant/items/${item.id}` : "/api/merchant/items",
        {
          method: item ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            category_id: resolvedCategoryId,
            prices,
            is_available: available,
            is_active: active,
          }),
        },
      );
      const data = (await response.json()) as { error?: string; item?: { id: string } };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "Could not save item");
      }

      if (image) {
        const formData = new FormData();
        formData.append("image", image);
        const upload = await fetch(`/api/merchant/items/${data.item.id}/image`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const uploadData = (await upload.json()) as { error?: string };
        if (!upload.ok) {
          throw new Error(uploadData.error || "Item saved, but image upload failed");
        }
      }

      if (onSaved) {
        onSaved();
      } else {
        router.replace("/merchant/menu");
        router.refresh();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save item");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!item) {
      return;
    }
    if (!window.confirm("Delete this item?")) {
      return;
    }
    setLoading(true);
    const response = await fetch(`/api/merchant/items/${item.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      setError("Could not delete item");
      setLoading(false);
      return;
    }
    if (onSaved) {
      onSaved();
    } else {
      router.replace("/merchant/menu");
      router.refresh();
    }
  }

  return (
    <form
      id={formId}
      className="flex w-full max-w-full flex-col gap-4 overflow-x-hidden"
      onSubmit={onSubmit}
    >
      <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
        <FieldLabel text="Item name" required />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 w-full min-w-0 rounded-2xl border border-border bg-background px-3 text-base outline-none focus:border-accent sm:px-4"
          placeholder="Cappuccino"
          required
        />
      </label>

      <div className="relative flex min-w-0 flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="item-category">
          <FieldLabel text="Category" required />
        </label>
        <div className="relative min-w-0">
          <input
            id="item-category"
            value={categoryQuery}
            onChange={(event) => onCategoryQueryChange(event.target.value)}
            onFocus={() => setCategoryOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setCategoryOpen(false), 150);
            }}
            className="h-12 w-full min-w-0 rounded-2xl border border-border bg-background px-3 pr-14 text-base outline-none focus:border-accent sm:px-4"
            placeholder="Search or type a new category"
            autoComplete="off"
            required
          />
          {categoryQuery ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearCategory}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted"
            >
              Clear
            </button>
          ) : null}
        </div>
        {categoryOpen ? (
          <div className="absolute top-full right-0 left-0 z-20 mt-1 max-w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
            {categoryMatches.map((category) => (
              <button
                key={category.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCategory(category)}
                className="flex w-full min-w-0 items-center justify-between gap-2 px-3 py-3 text-left text-sm hover:bg-background sm:px-4"
              >
                <span className="min-w-0 truncate">{category.name}</span>
                {categoryId === category.id ? (
                  <span className="shrink-0 text-xs font-medium text-accent">Selected</span>
                ) : null}
              </button>
            ))}
            {canCreateCategory ? (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setCategoryId("");
                  setCategoryOpen(false);
                }}
                className="flex w-full border-t border-border px-3 py-3 text-left text-sm font-medium break-words text-accent hover:bg-background sm:px-4"
              >
                Create “{categoryQuery.trim()}” when you save
              </button>
            ) : null}
            {!canCreateCategory && categoryMatches.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted sm:px-4">Type a name to create one</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <FieldLabel text="Price" required />
        <button
          type="button"
          onClick={() => toggleDifferentPrices(!differentPrices)}
          className="flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-3 text-left sm:px-4"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">Different prices?</p>
            <p className="text-xs text-muted">Small / Medium / Large, Half / Full…</p>
          </div>
          <span
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              differentPrices ? "bg-accent" : "bg-border"
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                differentPrices ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        </button>

        {!differentPrices ? (
          <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
            <span className="sr-only">Price in rupees</span>
            <input
              inputMode="decimal"
              value={priceRows[0]?.price ?? ""}
              onChange={(event) => setSinglePrice(event.target.value)}
              className="h-12 w-full min-w-0 rounded-2xl border border-border bg-background px-3 text-base outline-none focus:border-accent sm:px-4"
              placeholder="₹ 120"
              required
            />
          </label>
        ) : (
          <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-background p-2.5 sm:p-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applySizePresets}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium"
              >
                Small / Medium / Large
              </button>
            </div>
            {priceRows.map((row, index) => (
              <div
                key={row.id ?? `new-${index}`}
                className="flex min-w-0 items-end gap-2"
              >
                <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium">
                  <FieldLabel text="Name" required compact />
                  <input
                    value={row.name}
                    onChange={(event) => updateRow(index, { name: event.target.value })}
                    className="h-12 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base outline-none focus:border-accent"
                    placeholder="Small"
                    required
                  />
                </label>
                <label className="flex w-[4.75rem] shrink-0 flex-col gap-1.5 text-xs font-medium sm:w-[5.5rem]">
                  <FieldLabel text="₹" required compact />
                  <input
                    inputMode="decimal"
                    value={row.price}
                    onChange={(event) => updateRow(index, { price: event.target.value })}
                    className="h-12 w-full rounded-xl border border-border bg-surface px-2 text-base outline-none focus:border-accent sm:px-3"
                    placeholder="120"
                    required
                  />
                </label>
                {priceRows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="mb-0.5 flex h-12 w-9 shrink-0 items-center justify-center text-sm font-medium text-danger"
                    aria-label="Remove price"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="w-9 shrink-0" aria-hidden />
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRow}
              className="h-10 rounded-xl border border-dashed border-border text-sm font-medium"
            >
              Add price
            </button>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <FieldLabel text="Photo" optional />
        <label className="relative flex min-h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-background px-3 py-5 text-center sm:px-4">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div
            className={`relative z-10 flex max-w-full flex-col items-center gap-1 ${
              previewUrl ? "rounded-2xl bg-black/45 px-3 py-3 text-white" : "text-muted"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              📷
            </span>
            <span className="text-sm font-medium">
              {previewUrl ? "Change photo" : "Tap to add photo"}
            </span>
            <span className="text-xs opacity-80">JPG, PNG, or WebP</span>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
        <FieldLabel text="Description" optional />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="w-full min-w-0 rounded-2xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-accent sm:px-4"
          placeholder="Creamy espresso with steamed milk"
        />
      </label>

      <div className="flex min-w-0 flex-col gap-2">
        <ToggleRow
          title="Available now"
          subtitle="Optional — customers can order this"
          checked={available}
          onChange={setAvailable}
        />
        <ToggleRow
          title="Show on menu"
          subtitle="Optional — hide without deleting"
          checked={active}
          onChange={setActive}
        />
      </div>

      {error ? <p className="text-sm break-words text-danger">{error}</p> : null}

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 text-base font-medium text-accent-foreground disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save item"}
        </button>
        {onCancel ? (
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="h-11 text-sm font-medium text-muted"
          >
            Cancel
          </button>
        ) : null}
        {item ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void remove()}
            className="h-11 text-sm font-medium text-danger"
          >
            Delete item
          </button>
        ) : null}
      </div>
    </form>
  );
}

function FieldLabel({
  text,
  required,
  optional,
  compact,
}: {
  text: string;
  required?: boolean;
  optional?: boolean;
  compact?: boolean;
}) {
  return (
    <span className={`inline-flex items-baseline gap-1 ${compact ? "" : ""}`}>
      <span>{text}</span>
      {required ? (
        <span className="font-semibold text-danger" aria-hidden>
          *
        </span>
      ) : null}
      {optional ? (
        <span className="text-xs font-normal text-muted">(optional)</span>
      ) : null}
    </span>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-3 text-left sm:px-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-border"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
