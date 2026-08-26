"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  shiftDateKey,
  todayDateKeyInIndia,
} from "@/lib/time";

export function ReportDateControls({ dateKey }: { dateKey: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = todayDateKeyInIndia();
  const yesterday = shiftDateKey(today, -1);

  function go(next: string) {
    if (pending) {
      return;
    }
    startTransition(() => {
      if (next === today) {
        router.push("/merchant/reports");
        return;
      }
      router.push(`/merchant/reports?date=${next}`);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <PresetButton
          active={dateKey === today}
          label="Today"
          disabled={pending}
          onClick={() => go(today)}
        />
        <PresetButton
          active={dateKey === yesterday}
          label="Yesterday"
          disabled={pending}
          onClick={() => go(yesterday)}
        />
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Custom date</span>
        <input
          type="date"
          value={dateKey}
          max={today}
          disabled={pending}
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              go(value);
            }
          }}
          className="h-11 rounded-2xl border border-border bg-surface px-3 text-base disabled:opacity-60"
        />
      </label>
      {pending ? <p className="text-xs text-muted">Loading…</p> : null}
    </div>
  );
}

function PresetButton({
  active,
  label,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || active}
      className={`flex h-10 items-center rounded-2xl px-3.5 text-sm font-medium disabled:opacity-60 ${
        active
          ? "bg-accent text-accent-foreground"
          : "border border-border bg-surface"
      }`}
    >
      {label}
    </button>
  );
}
