"use client";

import { ORDER_FILTERS, type MerchantOrderFilter, type OrderFilterCounts } from "@/lib/orders/status";
import { PendingLink } from "../../_components/pending-link";

export function OrderFilters({
  current,
  counts,
}: {
  current: MerchantOrderFilter;
  counts: OrderFilterCounts;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {ORDER_FILTERS.map((filter) => {
        const href =
          filter.id === "all"
            ? "/merchant/orders"
            : `/merchant/orders?filter=${filter.id}`;
        const active = current === filter.id;
        return (
          <PendingLink
            key={filter.id}
            href={href}
            variant="button"
            onClick={(event) => {
              if (active) {
                event.preventDefault();
              }
            }}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
              active ? "bg-accent text-accent-foreground" : "bg-surface text-muted"
            }`}
          >
            {filter.label}
            <span className="ml-1 text-xs opacity-80">{counts[filter.id]}</span>
          </PendingLink>
        );
      })}
    </div>
  );
}
