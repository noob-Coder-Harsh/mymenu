"use client";

import { useState } from "react";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const absolute =
        value.startsWith("http")
          ? value
          : `${window.location.origin}${value.startsWith("/") ? value : `/${value}`}`;
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
