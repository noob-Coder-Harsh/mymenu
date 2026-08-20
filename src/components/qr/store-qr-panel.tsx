"use client";

import { useEffect, useMemo, useState } from "react";
import { PRODUCT_NAME } from "@/lib/constants";
import {
  DEFAULT_QR_DESIGN,
  QR_DESIGNS,
  type QrDesignId,
} from "@/lib/qr/designs";
import {
  downloadQrPdf,
  downloadQrPng,
  uploadGeneratedQrs,
} from "@/lib/qr/download";
import { renderQrPoster } from "@/lib/qr/render-poster";

function menuUrlForSlug(slug: string) {
  if (typeof window === "undefined") {
    return `/s/${slug}`;
  }
  return `${window.location.origin}/s/${slug}`;
}

export function StoreQrPanel({
  storeName,
  slug,
  mode = "manage",
  onContinue,
}: {
  storeName: string;
  slug: string;
  mode?: "manage" | "welcome";
  onContinue?: () => void;
}) {
  const [designId, setDesignId] = useState<QrDesignId>(DEFAULT_QR_DESIGN);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"png" | "pdf" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const posterInput = useMemo(
    () => ({
      storeName,
      menuUrl: menuUrlForSlug(slug),
      productName: PRODUCT_NAME,
    }),
    [slug, storeName],
  );

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function render() {
      setError(null);
      try {
        const canvas = await renderQrPoster({ ...posterInput, designId });
        if (cancelled) {
          return;
        }
        objectUrl = canvas.toDataURL("image/png");
        setPreviewUrl(objectUrl);
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not build QR");
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
      if (objectUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [designId, posterInput]);

  useEffect(() => {
    if (mode !== "welcome") {
      return;
    }
    let cancelled = false;
    async function persist() {
      setBusy("save");
      setError(null);
      try {
        await uploadGeneratedQrs(posterInput);
        if (!cancelled) {
          setSavedNote("QR posters saved for your store");
        }
      } catch (reason) {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not save QR posters (you can still download)",
          );
        }
      } finally {
        if (!cancelled) {
          setBusy(null);
        }
      }
    }
    void persist();
    return () => {
      cancelled = true;
    };
  }, [mode, posterInput]);

  async function onDownloadPng() {
    setBusy("png");
    setError(null);
    try {
      await downloadQrPng(posterInput, designId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Download failed");
    } finally {
      setBusy(null);
    }
  }

  async function onDownloadPdf() {
    setBusy("pdf");
    setError(null);
    try {
      await downloadQrPdf(posterInput, designId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Download failed");
    } finally {
      setBusy(null);
    }
  }

  async function onSaveAll() {
    setBusy("save");
    setError(null);
    setSavedNote(null);
    try {
      await uploadGeneratedQrs(posterInput);
      setSavedNote("All 4 designs saved");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save QR posters");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "welcome" ? (
        <div className="rounded-3xl border border-border bg-surface px-4 py-4">
          <p className="text-sm font-semibold">Your menu QR is ready</p>
          <p className="mt-1 text-sm text-muted">
            We generated 4 poster styles. Download one for your counter, table, or window.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-semibold">Menu QR posters</h3>
          <p className="mt-1 text-xs text-muted">
            Print and stick near the counter — customers scan to open your menu
          </p>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {QR_DESIGNS.map((design) => {
          const selected = design.id === designId;
          return (
            <button
              key={design.id}
              type="button"
              onClick={() => setDesignId(design.id)}
              className={`shrink-0 rounded-2xl border px-3 py-2 text-left ${
                selected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface"
              }`}
            >
              <p className="text-sm font-medium">
                {design.label}
                {design.id === DEFAULT_QR_DESIGN ? (
                  <span className="ml-1 text-[10px] font-semibold text-accent">
                    Default
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 max-w-28 text-[11px] leading-4 text-muted">
                {design.blurb}
              </p>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface p-3">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`${storeName} QR poster`}
            className="mx-auto max-h-[420px] w-full max-w-sm rounded-2xl object-contain"
          />
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-muted">
            Building poster…
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void onDownloadPng()}
          className="flex h-12 items-center justify-center rounded-2xl bg-accent text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {busy === "png" ? "Preparing…" : "Download image"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void onDownloadPdf()}
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium disabled:opacity-60"
        >
          {busy === "pdf" ? "Preparing…" : "Download PDF"}
        </button>
      </div>

      {mode === "manage" ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void onSaveAll()}
          className="h-11 text-sm font-medium text-accent disabled:opacity-60"
        >
          {busy === "save" ? "Saving designs…" : "Save all 4 designs to store"}
        </button>
      ) : null}

      {busy === "save" && mode === "welcome" ? (
        <p className="text-xs text-muted">Saving poster designs…</p>
      ) : null}
      {savedNote ? <p className="text-sm text-success">{savedNote}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {mode === "welcome" && onContinue ? (
        <button
          type="button"
          onClick={onContinue}
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium"
        >
          Continue to dashboard
        </button>
      ) : null}
    </div>
  );
}
