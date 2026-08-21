"use client";

import { useState } from "react";
import { buildReceiptDocument } from "@/lib/receipts/build-receipt";
import {
  downloadReceiptPdf,
  downloadReceiptPng,
} from "@/lib/receipts/download-receipt";
import type { PaymentMethod, PaymentStatus } from "@/lib/types/database";

export type ReceiptDownloadOrder = {
  order_number: string;
  created_at: string;
  is_takeaway: boolean;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes: string | null;
  items: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
};

export function ReceiptDownloadButton({
  order,
  storeName,
  storePhone,
  format,
  label,
  className,
}: {
  order: ReceiptDownloadOrder;
  storeName: string;
  storePhone: string | null;
  format: "png" | "pdf";
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDownload() {
    setBusy(true);
    setError(null);
    try {
      const receipt = buildReceiptDocument(order, {
        name: storeName,
        phone: storePhone,
      });
      if (format === "png") {
        await downloadReceiptPng(receipt);
      } else {
        await downloadReceiptPdf(receipt);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => void onDownload()}
        className={
          className ??
          "flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-base font-medium disabled:opacity-60"
        }
      >
        {busy ? "Preparing…" : label}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
