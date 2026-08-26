"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { StoreQrPanel } from "@/components/qr/store-qr-panel";
import { logoutMerchant } from "@/lib/auth/client-logout";
import { PRODUCT_NAME } from "@/lib/constants";
import { useStoreNameCheck } from "@/lib/stores/use-store-name-check";
import type { Store } from "@/lib/types/database";

export function OnboardingForm({ defaultPhone }: { defaultPhone: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(defaultPhone.replace(/^\+91/, ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStore, setCreatedStore] = useState<Store | null>(null);
  const { status: nameStatus, previewSlug, isTaken } = useStoreNameCheck(name);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (name.trim().length < 2) {
        throw new Error("Enter a store name");
      }
      if (isTaken) {
        throw new Error("Name already exists — use a different one");
      }

      const response = await fetch("/api/merchant/stores", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() ? `+91${phone.replace(/\D/g, "").slice(-10)}` : undefined,
        }),
      });
      const data = (await response.json()) as { error?: string; store?: Store };
      if (!response.ok || !data.store) {
        throw new Error(data.error || "Could not create store");
      }
      setCreatedStore(data.store);
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

  if (createdStore) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-accent">{PRODUCT_NAME}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Store created</h1>
          <p className="text-sm leading-6 text-muted">
            Download a QR poster now, or grab one anytime from Store.
          </p>
        </div>
        <StoreQrPanel
          storeName={createdStore.name}
          slug={createdStore.slug}
          mode="welcome"
          onContinue={() => {
            router.replace("/merchant");
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-accent">{PRODUCT_NAME}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Create your store</h1>
        <p className="text-sm leading-6 text-muted">
          Name your shop, then we&apos;ll make printable QR posters for your counter.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Store name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={`h-12 rounded-2xl border bg-surface px-4 text-base outline-none focus:border-accent ${
              isTaken ? "border-danger" : "border-border"
            }`}
            placeholder="Brew Cafe"
            autoComplete="organization"
            aria-invalid={isTaken}
            aria-describedby="onboarding-name-feedback"
          />
          <span id="onboarding-name-feedback" className="text-xs font-normal">
            {nameStatus === "checking" ? (
              <span className="text-muted">Checking name…</span>
            ) : isTaken ? (
              <span className="text-danger">
                Name already exists — use a different one
              </span>
            ) : name.trim().length >= 2 && nameStatus === "available" ? (
              <span className="text-muted">Menu link: /s/{previewSlug}</span>
            ) : previewSlug ? (
              <span className="text-muted">Menu link: /s/{previewSlug}</span>
            ) : (
              <span className="text-muted">Your menu link is made from this name</span>
            )}
          </span>
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
          disabled={loading || isTaken || nameStatus === "checking" || name.trim().length < 2}
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
    </div>
  );
}
