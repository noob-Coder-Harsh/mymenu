"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { logoutMerchant } from "@/lib/auth/client-logout";

export function OnboardingForm({ defaultPhone }: { defaultPhone: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(defaultPhone.replace(/^\+91/, ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/merchant/stores", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() ? `+91${phone.replace(/\D/g, "").slice(-10)}` : undefined,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Could not create store");
      }
      router.replace("/merchant");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create store");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await logoutMerchant();
    router.replace("/merchant/login");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Store name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
          placeholder="Brew Cafe"
          autoComplete="organization"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Store phone
        <div className="flex overflow-hidden rounded-2xl border border-border bg-surface">
          <span className="flex items-center bg-background px-3 text-muted">+91</span>
          <input
            inputMode="numeric"
            maxLength={10}
            value={phone.replace(/\D/g, "").slice(-10)}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
            }
            className="h-12 w-full bg-transparent px-3 text-base outline-none"
          />
        </div>
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-medium text-accent-foreground disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create store"}
      </button>
      <button
        type="button"
        onClick={() => void logout()}
        className="text-sm font-medium text-muted"
      >
        Use a different phone
      </button>
    </form>
  );
}
