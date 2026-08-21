import { jsPDF } from "jspdf";
import type { ReceiptDocument } from "@/lib/receipts/types";
import {
  RECEIPT_WIDTH_PX,
  receiptCanvasToPngBlob,
  renderReceiptCanvas,
} from "@/lib/receipts/render-receipt";

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function receiptFileBase(receipt: ReceiptDocument) {
  const store = slugPart(receipt.storeName) || "store";
  const order = slugPart(receipt.orderNumber) || "order";
  return `${store}-receipt-${order}`;
}

export async function downloadReceiptPng(receipt: ReceiptDocument) {
  const canvas = renderReceiptCanvas(receipt);
  const blob = await receiptCanvasToPngBlob(canvas);
  triggerDownload(blob, `${receiptFileBase(receipt)}.png`);
}

export async function downloadReceiptPdf(receipt: ReceiptDocument) {
  const canvas = renderReceiptCanvas(receipt);
  const dataUrl = canvas.toDataURL("image/png");
  // ~58mm paper width; height scales with content.
  // Do NOT force "portrait" when height < width — jsPDF swaps axes and crops the right side.
  const widthMm = 58;
  const heightMm = Math.max((canvas.height / RECEIPT_WIDTH_PX) * widthMm, 40);
  const pdf = new jsPDF({
    orientation: heightMm >= widthMm ? "portrait" : "landscape",
    unit: "mm",
    format: [widthMm, heightMm],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, widthMm, heightMm);
  pdf.save(`${receiptFileBase(receipt)}.pdf`);
}
