"use client";

import { useState } from "react";
import { formatInr } from "@/lib/money";

export function TodaySummary({
  todayCount,
  todaySales,
  pendingCount,
  newCustomersToday,
  isOpen,
}: {
  todayCount: number;
  todaySales: number;
  pendingCount: number;
  newCustomersToday: number;
  isOpen: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
      >
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">Today</span>
          <span className="text-muted">
            {" "}
            · {todayCount} {todayCount === 1 ? "order" : "orders"} ·{" "}
            {formatInr(todaySales)}
          </span>
        </p>
        <span className="text-xs font-medium text-accent">
          {open ? "Less" : "More"}
        </span>
      </button>
      {open ? (
        <div className="grid grid-cols-2 gap-2 border-t border-border px-3.5 py-2.5 text-xs text-muted">
          <p>
            Waiting{" "}
            <span className="font-semibold text-foreground">{pendingCount}</span>
          </p>
          <p>
            Customers{" "}
            <span className="font-semibold text-foreground">
              {newCustomersToday}
            </span>
          </p>
          <p className="col-span-2">
            Store is {isOpen ? "open" : "closed"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
