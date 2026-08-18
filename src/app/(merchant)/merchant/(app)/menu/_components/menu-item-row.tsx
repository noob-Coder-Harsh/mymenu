import Link from "next/link";
import { formatInr } from "@/lib/money";
import type { MenuItemView } from "@/lib/menu/types";
import { AvailabilityToggle } from "./availability-toggle";

export function MenuItemRow({ item }: { item: MenuItemView }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt=""
          className="h-14 w-14 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background text-xs text-muted">
          No pic
        </div>
      )}
      <Link href={`/merchant/menu/${item.id}`} className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-sm text-muted">{formatInr(item.price)}</p>
        {!item.is_active ? (
          <p className="text-xs text-muted">Hidden from menu</p>
        ) : null}
      </Link>
      <AvailabilityToggle itemId={item.id} isAvailable={item.is_available} />
    </div>
  );
}
