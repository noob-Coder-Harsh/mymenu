"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { MenuCategory } from "@/lib/types/database";
import type { MenuItemView } from "@/lib/menu/types";

export function ItemForm({
  categories,
  item,
}: {
  categories: MenuCategory[];
  item?: MenuItemView;
}) {
  const router = useRouter();
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [available, setAvailable] = useState(item?.is_available ?? true);
  const [active, setActive] = useState(item?.is_active ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        price,
        is_available: available,
        is_active: active,
      };

      const response = await fetch(
        item ? `/api/merchant/items/${item.id}` : "/api/merchant/items",
        {
          method: item ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

      router.replace("/merchant/menu");
      router.refresh();
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
    router.replace("/merchant/menu");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Item name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
          placeholder="Cappuccino"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="rounded-2xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
          placeholder="Creamy espresso with steamed milk"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Category
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="h-12 rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
        >
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Price (₹)
        <input
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="h-12 rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
          placeholder="120"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          className="text-sm text-muted"
        />
      </label>
      <label className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium">
        Available now
        <input
          type="checkbox"
          checked={available}
          onChange={(event) => setAvailable(event.target.checked)}
        />
      </label>
      <label className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium">
        Show on menu
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-medium text-accent-foreground disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save item"}
      </button>
      {item ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void remove()}
          className="h-12 text-sm font-medium text-danger"
        >
          Delete item
        </button>
      ) : null}
    </form>
  );
}
