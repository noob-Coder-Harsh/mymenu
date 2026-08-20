"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { Store, StoreSettings } from "@/lib/types/database";

function phoneLocal(value: string | null) {
  if (!value) {
    return "";
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits.slice(-10);
}

function FieldLabel({
  text,
  required,
  optional,
}: {
  text: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-1">
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
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-left"
    >
      <div className="min-w-0 pr-3">
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

export function StoreEditForm({
  store,
  settings,
}: {
  store: Store;
  settings: StoreSettings;
}) {
  const router = useRouter();
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description ?? "");
  const [phone, setPhone] = useState(phoneLocal(store.phone));
  const [upiId, setUpiId] = useState(store.upi_id ?? "");
  const [currency, setCurrency] = useState(settings.currency);
  const [orderPrefix, setOrderPrefix] = useState(settings.order_prefix);
  const [phoneRequired, setPhoneRequired] = useState(settings.customer_phone_required);
  const [notifications, setNotifications] = useState(
    settings.order_notifications_enabled,
  );
  const [autoAccept, setAutoAccept] = useState(settings.auto_accept_orders);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(store.logo_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#settings") {
      document.getElementById("settings")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (name.trim().length < 2) {
        throw new Error("Enter a store name");
      }

      const response = await fetch("/api/merchant/stores", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          phone: phone.trim() ? phone.trim() : null,
          upi_id: upiId.trim() ? upiId.trim() : null,
          settings: {
            currency: currency.trim().toUpperCase() || "INR",
            order_prefix: orderPrefix.trim().toUpperCase() || "ORD",
            customer_phone_required: phoneRequired,
            order_notifications_enabled: notifications,
            auto_accept_orders: autoAccept,
          },
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Could not save store");
      }

      if (logoFile) {
        const formData = new FormData();
        formData.append("image", logoFile);
        const upload = await fetch("/api/merchant/stores/logo", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const uploadData = (await upload.json()) as { error?: string };
        if (!upload.ok) {
          throw new Error(uploadData.error || "Store saved, but logo upload failed");
        }
      }

      setMessage("Saved");
      setLogoFile(null);
      router.replace("/merchant/store");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save store");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold">Store profile</h2>

        <div className="flex flex-col gap-2">
          <FieldLabel text="Logo" optional />
          <label className="relative flex min-h-28 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-background px-4 py-5 text-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div
              className={`relative z-10 flex flex-col items-center gap-1 ${
                previewUrl ? "rounded-2xl bg-black/45 px-4 py-3 text-white" : "text-muted"
              }`}
            >
              <span className="text-sm font-medium">
                {previewUrl ? "Change logo" : "Tap to add logo"}
              </span>
              <span className="text-xs opacity-80">JPG, PNG, or WebP · under 2 MB</span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium">
          <FieldLabel text="Store name" required />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 rounded-2xl border border-border bg-background px-4 text-base outline-none focus:border-accent"
            placeholder="Brew Cafe"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          <FieldLabel text="Description" optional />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={500}
            className="rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
            placeholder="Fresh coffee, snacks, and quick bites"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          <FieldLabel text="Phone" optional />
          <div className="flex overflow-hidden rounded-2xl border border-border bg-background">
            <span className="flex items-center bg-surface px-3 text-muted">+91</span>
            <input
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="h-12 w-full bg-transparent px-3 text-base outline-none"
              placeholder="98765 43210"
            />
          </div>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          <FieldLabel text="UPI ID" optional />
          <input
            value={upiId}
            onChange={(event) => setUpiId(event.target.value)}
            className="h-12 rounded-2xl border border-border bg-background px-4 text-base outline-none focus:border-accent"
            placeholder="brewcafe@upi"
            autoCapitalize="off"
            autoCorrect="off"
          />
          <span className="text-xs font-normal text-muted">
            Customers can pay to this ID after placing an order
          </span>
        </label>

        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <p className="text-xs font-medium text-muted">Menu link (fixed)</p>
          <p className="mt-1 text-sm font-medium">/s/{store.slug}</p>
        </div>
      </section>

      <section id="settings" className="flex scroll-mt-24 flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold">Order settings</h2>
          <p className="text-xs text-muted">From your store settings</p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium">
          <FieldLabel text="Currency" required />
          <input
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            className="h-12 rounded-2xl border border-border bg-background px-4 text-base outline-none focus:border-accent"
            placeholder="INR"
            maxLength={8}
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          <FieldLabel text="Order prefix" required />
          <input
            value={orderPrefix}
            onChange={(event) =>
              setOrderPrefix(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
            }
            className="h-12 rounded-2xl border border-border bg-background px-4 text-base outline-none focus:border-accent"
            placeholder="ORD"
            maxLength={8}
            required
          />
          <span className="text-xs font-normal text-muted">
            Orders look like {orderPrefix || "ORD"}0001
          </span>
        </label>

        <ToggleRow
          title="Customer phone required"
          subtitle="Ask for mobile number at checkout"
          checked={phoneRequired}
          onChange={setPhoneRequired}
        />
        <ToggleRow
          title="Order notifications"
          subtitle="Alert when a new order comes in"
          checked={notifications}
          onChange={setNotifications}
        />
        <ToggleRow
          title="Auto-accept orders"
          subtitle="Skip pending — go straight to accepted"
          checked={autoAccept}
          onChange={setAutoAccept}
        />
      </section>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-medium text-accent-foreground disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => router.push("/merchant/store")}
          className="h-11 text-sm font-medium text-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
