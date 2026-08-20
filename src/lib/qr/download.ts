import { jsPDF } from "jspdf";
import {
  DEFAULT_QR_DESIGN,
  QR_DESIGN_IDS,
  type QrDesignId,
} from "./designs";
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  canvasToBlob,
  renderQrPoster,
  type PosterInput,
} from "./render-poster";

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadQrPng(
  input: PosterInput,
  designId: QrDesignId = DEFAULT_QR_DESIGN,
) {
  const canvas = await renderQrPoster({ ...input, designId });
  const blob = await canvasToBlob(canvas);
  const base = slugPart(input.storeName) || "store";
  triggerDownload(blob, `${base}-qr-${designId}.png`);
}

export async function downloadQrPdf(
  input: PosterInput,
  designId: QrDesignId = DEFAULT_QR_DESIGN,
) {
  const canvas = await renderQrPoster({ ...input, designId });
  const dataUrl = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [POSTER_WIDTH, POSTER_HEIGHT],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  const base = slugPart(input.storeName) || "store";
  pdf.save(`${base}-qr-${designId}.pdf`);
}

export async function generateAllQrPngBlobs(input: Omit<PosterInput, "designId">) {
  const results: { designId: QrDesignId; blob: Blob }[] = [];
  for (const designId of QR_DESIGN_IDS) {
    const canvas = await renderQrPoster({ ...input, designId });
    const blob = await canvasToBlob(canvas);
    results.push({ designId, blob });
  }
  return results;
}

export async function uploadGeneratedQrs(
  input: Omit<PosterInput, "designId">,
  designs: QrDesignId[] = [...QR_DESIGN_IDS],
) {
  const formData = new FormData();
  for (const designId of designs) {
    const canvas = await renderQrPoster({ ...input, designId });
    const blob = await canvasToBlob(canvas);
    formData.append("files", blob, `${designId}.png`);
    formData.append("designs", designId);
  }

  const response = await fetch("/api/merchant/stores/qr", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = (await response.json()) as { error?: string; urls?: Record<string, string> };
  if (!response.ok) {
    throw new Error(data.error || "Could not save QR codes");
  }
  return data.urls ?? {};
}
