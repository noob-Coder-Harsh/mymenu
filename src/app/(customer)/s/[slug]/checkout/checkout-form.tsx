"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { formatInr } from "@/lib/money";
import { toE164India } from "@/lib/phone";
import { buildCartEntries } from "@/lib/cart/summary";
import type { MenuItemView } from "@/lib/menu/types";
import { useCart } from "../_components/cart-provider";

type CheckoutPayment = "upi" | "cash";

export function CheckoutForm({
  slug,
  items,
  storeOpen,
  phoneRequired,
  upiId,
}: {
  slug: string;
  items: MenuItemView[];
  storeOpen: boolean;
  phoneRequired: boolean;
  upiId: string | null;
}) {
  const router = useRouter();
  const { lines, notes, setNotes, ready, clear } = useCart();
  const summary = useMemo(() => buildCartEntries(lines, items), [items, lines]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPayment>("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return <p className="text-sm text-muted">Loading checkout…</p>;
  }

  if (!storeOpen) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">This store is closed right now.</p>
        <Link href={`/s/${slug}`} className="text-sm font-medium text-accent">
          Back to menu
        </Link>
      </div>
    );
  }

  if (summary.itemCount === 0) {
    return (
      <div className="flex flex-col gap-3">
        {summary.missing > 0 ? (
          <p className="text-sm text-danger">
            Sold-out items were left out of this order. Add something else to check out.
          </p>
        ) : (
          <p className="text-sm text-muted">Add items before checkout.</p>
        )}
        <Link href={`/s/${slug}`} className="text-sm font-medium text-accent">
          Back to menu
        </Link>
      </div>
    );
  }

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
          payment_method: paymentMethod,
          notes,
          items: summary.available.map((line) => ({
            menu_item_id: line.item.id,
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
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      {summary.missing > 0 ? (
        <p className="text-sm text-danger">Some cart items were left out because they are sold out.</p>
      ) : null}

      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
        {summary.available.map((line) => (
          <div key={line.item.id} className="flex justify-between text-sm">
            <span>
              {line.quantity} × {line.item.name}
            </span>
            <span>{formatInr(line.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatInr(summary.subtotal)}</span>
        </div>
      </section>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Your name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
          minLength={2}
          className="h-12 rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Phone {phoneRequired ? "" : "(optional)"}
        <div className="flex overflow-hidden rounded-2xl border border-border bg-surface">
          <span className="flex items-center bg-background px-3 text-muted">+91</span>
          <input
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            required={phoneRequired}
            className="h-12 w-full bg-transparent px-3 text-base outline-none"
            placeholder="98765 43210"
          />
        </div>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Payment</legend>
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "upi"}
            onChange={() => setPaymentMethod("upi")}
          />
          <span>UPI {upiId ? `· ${upiId}` : "· pay at counter"}</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "cash"}
            onChange={() => setPaymentMethod("cash")}
          />
          Cash at counter
        </label>
      </fieldset>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Less spicy, extra napkins…"
          className="rounded-2xl border border-border bg-surface px-4 py-3 text-base font-normal outline-none focus:border-accent"
        />
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 items-center justify-center rounded-2xl bg-accent text-base font-medium text-accent-foreground disabled:opacity-60"
      >
        {loading ? "Placing order…" : `Place order · ${formatInr(summary.subtotal)}`}
      </button>
    </form>
  );
}
