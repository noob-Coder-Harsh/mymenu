"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { formatInr } from "@/lib/money";
import { toE164India } from "@/lib/phone";
import { buildCartEntries, type CartEntry } from "@/lib/cart/summary";
import {
  readCustomerProfile,
  writeCustomerProfile,
} from "@/lib/customer/profile";
import type { MenuItemView } from "@/lib/menu/types";
import { useCart } from "../_components/cart-provider";

export function CheckoutForm({
  slug,
  items,
  storeOpen,
  phoneRequired,
}: {
  slug: string;
  items: MenuItemView[];
  storeOpen: boolean;
  phoneRequired: boolean;
}) {
  const router = useRouter();
  const { lines, notes, setNotes, ready, clear } = useCart();
  const summary = useMemo(() => buildCartEntries(lines, items), [items, lines]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileReady, setProfileReady] = useState(false);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readCustomerProfile();
    if (saved.name) {
      setName(saved.name);
    }
    if (saved.phone) {
      setPhone(saved.phone);
    }
    setProfileReady(true);
  }, []);

  if (!ready || !profileReady) {
    return <p className="font-script text-base text-muted">Loading checkout…</p>;
  }

  if (!storeOpen) {
    return (
      <div className="customer-card flex flex-col gap-3 px-4 py-6 text-center">
        <p className="font-script text-lg text-muted">This store is closed right now.</p>
        <Link href={`/s/${slug}`} className="customer-link">
          Back to menu
        </Link>
      </div>
    );
  }

  if (summary.itemCount === 0) {
    return (
      <div className="customer-card flex flex-col gap-3 px-4 py-6 text-center">
        {summary.missing > 0 ? (
          <p className="text-sm text-danger">
            Sold-out items were left out of this order. Add something else to check out.
          </p>
        ) : (
          <p className="font-script text-lg text-muted">Add items before checkout.</p>
        )}
        <Link href={`/s/${slug}`} className="customer-link">
          Back to menu
        </Link>
      </div>
    );
  }

  const canCollapse = summary.available.length > 1;
  const collapsed = canCollapse && !summaryExpanded;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (phoneRequired || phone.trim()) {
      if (!toE164India(phone)) {
        setError("Enter a valid 10-digit mobile number.");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          payment_method: "cash",
          is_takeaway: isTakeaway,
          notes,
          items: summary.available.map((line) => ({
            menu_item_variant_id: line.variant.id,
            quantity: line.quantity,
          })),
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        order?: { id: string };
      };
      if (!response.ok || !data.order) {
        throw new Error(data.error || "Could not place order");
      }
      writeCustomerProfile({ name: name.trim(), phone: phone.trim() });
      clear();
      router.replace(`/s/${slug}/orders/${data.order.id}?placed=1`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not place order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={onSubmit}
    >
      {summary.missing > 0 ? (
        <p className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          Some cart items were left out because they are sold out.
        </p>
      ) : null}

      <section className="customer-card flex flex-col gap-2 p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Order summary</h2>
          <span className="text-xs text-muted">
            {summary.itemCount} item{summary.itemCount === 1 ? "" : "s"}
          </span>
        </div>

        {collapsed ? (
          <CollapsedSummaryLines
            first={summary.available[0]}
            peek={summary.available[1]}
          />
        ) : (
          summary.available.map((line) => (
            <SummaryLine key={line.variant.id} line={line} />
          ))
        )}

        {canCollapse ? (
          <button
            type="button"
            onClick={() => setSummaryExpanded((open) => !open)}
            className="customer-link mx-auto flex items-center gap-1 py-0.5"
          >
            {summaryExpanded ? "Show less" : "View more"}
            <ChevronIcon
              className={`h-3.5 w-3.5 transition-transform ${
                summaryExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        ) : null}

        <div className="mt-0.5 flex justify-between border-t border-dashed border-border pt-2 text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatInr(summary.subtotal)}</span>
        </div>
      </section>

      <section className="customer-card flex flex-col gap-2.5 p-3.5">
        <h2 className="text-sm font-semibold">Customer details</h2>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          <span>
            Name <span className="text-danger">*</span>
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            minLength={2}
            className="customer-input h-11 px-3.5 text-base font-normal"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          <span>
            Phone{" "}
            {phoneRequired ? (
              <span className="text-danger">*</span>
            ) : (
              <span className="font-normal text-muted">(optional)</span>
            )}
          </span>
          <div className="customer-input flex overflow-hidden">
            <span className="flex items-center bg-[#f3ebe3] px-3 text-muted">+91</span>
            <input
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              required={phoneRequired}
              className="h-11 w-full bg-transparent px-3 text-base font-normal outline-none"
              placeholder="98765 43210"
            />
          </div>
        </label>
      </section>

      <section className="customer-card flex flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Takeaway</p>
          <div className="flex shrink-0 gap-1.5" role="group" aria-label="Takeaway">
            <button
              type="button"
              onClick={() => setIsTakeaway(false)}
              aria-pressed={!isTakeaway}
              className={`h-9 min-w-14 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                !isTakeaway
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-muted"
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setIsTakeaway(true)}
              aria-pressed={isTakeaway}
              className={`h-9 min-w-14 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                isTakeaway
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-muted"
              }`}
            >
              Yes
            </button>
          </div>
        </div>
      </section>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Notes <span className="font-normal text-muted">(optional)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Less spicy, extra napkins…"
          className="customer-input px-3.5 py-2.5 text-base font-normal"
        />
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto w-full max-w-md bg-gradient-to-t from-[#efe4d8] via-[#efe4d8]/95 to-transparent px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            disabled={loading}
            className="customer-btn pointer-events-auto w-full shadow-lg shadow-accent/30"
          >
            {loading ? "Placing order…" : `Place order · ${formatInr(summary.subtotal)}`}
          </button>
        </div>
      </div>
    </form>
  );
}

function SummaryLine({ line }: { line: CartEntry }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="min-w-0">
        <span className="font-semibold">{line.quantity} ×</span> {line.label}
      </span>
      <span className="shrink-0 font-semibold tabular-nums">
        {formatInr(line.lineTotal)}
      </span>
    </div>
  );
}

function CollapsedSummaryLines({
  first,
  peek,
}: {
  first: CartEntry;
  peek: CartEntry;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SummaryLine line={first} />
      <div
        className="relative max-h-4 overflow-hidden opacity-40"
        aria-hidden
      >
        <div className="pointer-events-none select-none">
          <SummaryLine line={peek} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fffefb]" />
      </div>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
