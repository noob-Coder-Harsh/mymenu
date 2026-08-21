"use client";

import { useState } from "react";
import { downloadSalesReportPdf } from "@/lib/receipts/download-sales-report";
import type { SalesReportDocument } from "@/lib/receipts/types";

export function DownloadSalesReportButton({ dateKey }: { dateKey: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDownload() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/merchant/reports/sales?date=${encodeURIComponent(dateKey)}`,
        { credentials: "include" },
      );
      const data = (await response.json()) as {
        error?: string;
        document?: SalesReportDocument;
      };
      if (!response.ok || !data.document) {
        throw new Error(data.error || "Could not load sales report");
      }
      await downloadSalesReportPdf(data.document);
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
        className="flex h-12 items-center justify-center rounded-2xl bg-accent text-base font-medium text-accent-foreground disabled:opacity-60"
      >
        {busy ? "Preparing PDF…" : "Download PDF"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
