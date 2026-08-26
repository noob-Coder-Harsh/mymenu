"use client";

import { useEffect, useState } from "react";
import { slugify } from "@/lib/stores/slug";

export type StoreNameCheckStatus = "idle" | "checking" | "available" | "taken";

const DEBOUNCE_MS = 400;

export function useStoreNameCheck(
  name: string,
  options?: { currentName?: string },
) {
  const [status, setStatus] = useState<StoreNameCheckStatus>("idle");
  const [previewSlug, setPreviewSlug] = useState(() => slugify(name));

  useEffect(() => {
    const trimmed = name.trim();
    setPreviewSlug(slugify(trimmed));

    if (trimmed.length < 2) {
      setStatus("idle");
      return;
    }

    const current = options?.currentName?.trim() ?? "";
    if (current && trimmed.toLowerCase() === current.toLowerCase()) {
      setStatus("available");
      return;
    }

    setStatus("checking");
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/merchant/stores/check-name?name=${encodeURIComponent(trimmed)}`,
            { credentials: "include", signal: controller.signal },
          );
          const data = (await response.json()) as {
            available?: boolean;
            slug?: string;
            error?: string;
          };
          if (!response.ok) {
            setStatus("idle");
            return;
          }
          if (typeof data.slug === "string" && data.slug) {
            setPreviewSlug(data.slug);
          }
          setStatus(data.available ? "available" : "taken");
        } catch (reason) {
          if (reason instanceof DOMException && reason.name === "AbortError") {
            return;
          }
          setStatus("idle");
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [name, options?.currentName]);

  return { status, previewSlug, isTaken: status === "taken" };
}
