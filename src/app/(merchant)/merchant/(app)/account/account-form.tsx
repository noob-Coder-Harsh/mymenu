"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { formatPhoneDisplay } from "@/lib/phone";

export function AccountForm({
  name,
  phone,
}: {
  name: string;
  phone: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/merchant/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value.trim() }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Could not save profile");
      }
      setMessage("Saved");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save profile");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // Ignore Firebase sign-out errors.
    }
    router.replace("/merchant/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-4" onSubmit={save}>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Name
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-12 rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Phone
          <input
            value={formatPhoneDisplay(phone)}
            readOnly
            className="h-12 rounded-2xl border border-border bg-background px-4 text-base text-muted"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-success">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-medium text-accent-foreground disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save profile"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => void logout()}
        className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface px-5 text-base font-medium"
      >
        Log out
      </button>
    </div>
  );
}
