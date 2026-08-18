"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { MenuCategory } from "@/lib/types/database";

export function CategoryManager({ categories }: { categories: MenuCategory[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    startTransition(() => router.refresh());
  }

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/merchant/categories", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Could not add category");
      return;
    }
    setName("");
    await refresh();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(null);
    const response = await fetch(`/api/merchant/categories/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Could not update category");
      return;
    }
    await refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this category? Items stay on the menu, uncategorized.")) {
      return;
    }
    const response = await fetch(`/api/merchant/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      setError("Could not delete category");
      return;
    }
    await refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <form className="flex gap-2" onSubmit={addCategory}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Coffee, Snacks…"
          className="h-12 flex-1 rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-2xl bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {categories.length === 0 ? (
        <p className="text-sm text-muted">Add Coffee and Snacks to start building the menu.</p>
      ) : null}

      <div className="flex flex-col gap-2">
        {categories.map((category, index) => (
          <CategoryRow
            key={category.id}
            category={category}
            isFirst={index === 0}
            isLast={index === categories.length - 1}
            disabled={pending}
            onMove={(direction) => void patch(category.id, { move: direction })}
            onToggle={() => void patch(category.id, { is_active: !category.is_active })}
            onRename={(nextName) => void patch(category.id, { name: nextName })}
            onDelete={() => void remove(category.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  isFirst,
  isLast,
  disabled,
  onMove,
  onToggle,
  onRename,
  onDelete,
}: {
  category: MenuCategory;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onMove: (direction: "up" | "down") => void;
  onToggle: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(category.name);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
      {editing ? (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onRename(value);
            setEditing(false);
          }}
        >
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-10 flex-1 rounded-xl border border-border px-3 text-sm outline-none"
          />
          <button type="submit" className="text-sm font-medium text-accent">
            Save
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{category.name}</p>
          <span className="text-xs text-muted">
            {category.is_active ? "Visible" : "Hidden"}
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <button
          type="button"
          disabled={disabled || isFirst}
          onClick={() => onMove("up")}
          className="rounded-full border border-border px-3 py-1 disabled:opacity-40"
        >
          Up
        </button>
        <button
          type="button"
          disabled={disabled || isLast}
          onClick={() => onMove("down")}
          className="rounded-full border border-border px-3 py-1 disabled:opacity-40"
        >
          Down
        </button>
        <button
          type="button"
          onClick={() => setEditing((current) => !current)}
          className="rounded-full border border-border px-3 py-1"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-border px-3 py-1"
        >
          {category.is_active ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-border px-3 py-1 text-danger"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
