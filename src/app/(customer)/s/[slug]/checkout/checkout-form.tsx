"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { formatInr } from "@/lib/money";
import { toE164India } from "@/lib/phone";
import { buildCartEntries } from "@/lib/cart/summary";
import {
  readCustomerProfile,
  writeCustomerProfile,
} from "@/lib/customer/profile";
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
  const [profileReady, setProfileReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPayment>("upi");
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
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      {summary.missing > 0 ? (
        <p className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          Some cart items were left out because they are sold out.
        </p>
      ) : null}

      <section className="customer-card flex flex-col gap-2.5 p-4">
        {summary.available.map((line) => (
          <div key={line.variant.id} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="font-semibold">{line.quantity} ×</span> {line.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatInr(line.lineTotal)}
            </span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-dashed border-border pt-2 text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatInr(summary.subtotal)}</span>
        </div>
      </section>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Your name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
          minLength={2}
          className="customer-input h-12 px-4 text-base font-normal"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Phone {phoneRequired ? "" : "(optional)"}
        <div className="customer-input flex overflow-hidden">
          <span className="flex items-center bg-[#f3ebe3] px-3 text-muted">+91</span>
          <input
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            required={phoneRequired}
            className="h-12 w-full bg-transparent px-3 text-base font-normal outline-none"
            placeholder="98765 43210"
          />
        </div>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Payment</legend>
        <label className="customer-card flex items-center gap-3 px-4 py-3 text-sm">
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "upi"}
            onChange={() => setPaymentMethod("upi")}
            className="accent-[var(--accent)]"
          />
          <span>
            UPI {upiId ? <span className="text-muted">· {upiId}</span> : " · pay at counter"}
          </span>
        </label>
        <label className="customer-card flex items-center gap-3 px-4 py-3 text-sm">
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "cash"}
            onChange={() => setPaymentMethod("cash")}
            className="accent-[var(--accent)]"
          />
          Cash at counter
        </label>
      </fieldset>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Less spicy, extra napkins…"
          className="customer-input px-4 py-3 text-base font-normal"
        />
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button type="submit" disabled={loading} className="customer-btn">
        {loading ? "Placing order…" : `Place order · ${formatInr(summary.subtotal)}`}
      </button>
    </form>
  );
}
