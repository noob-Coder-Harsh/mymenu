import { jsPDF } from "jspdf";
import { PRODUCT_NAME } from "@/lib/constants";
import { formatAmountPlain } from "@/lib/money";
import type { ReceiptDocument, SalesReportDocument } from "@/lib/receipts/types";
import { triggerDownload } from "@/lib/receipts/download-receipt";
import {
  RECEIPT_WIDTH_PX,
  renderReceiptCanvas,
} from "@/lib/receipts/render-receipt";
import {
  PAYMENT_METHOD_LABELS,
} from "@/lib/types/labels";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ACCENT: [number, number, number] = [166, 93, 55];
const INK: [number, number, number] = [44, 24, 16];
const MUTED: [number, number, number] = [109, 93, 85];

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function rgb(pdf: jsPDF, color: [number, number, number]) {
  pdf.setTextColor(color[0], color[1], color[2]);
}

function fill(pdf: jsPDF, color: [number, number, number]) {
  pdf.setFillColor(color[0], color[1], color[2]);
}

function strokeInk(pdf: jsPDF) {
  pdf.setDrawColor(INK[0], INK[1], INK[2]);
}

/** Simple coloured title bar — only decoration on summary/index. */
function drawPageHeader(
  pdf: jsPDF,
  opts: { title: string; subtitle: string },
) {
  fill(pdf, ACCENT);
  pdf.rect(0, 0, PAGE_W, 28, "F");

  pdf.setTextColor(255, 253, 249);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(opts.title, MARGIN, 12);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(opts.subtitle, MARGIN, 21);

  return 38;
}

function drawFooter(pdf: jsPDF) {
  rgb(pdf, MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(`Powered by ${PRODUCT_NAME}`, PAGE_W / 2, PAGE_H - 10, {
    align: "center",
  });
}

function ensureSpace(pdf: jsPDF, y: number, needed: number) {
  if (y + needed > PAGE_H - 16) {
    pdf.addPage();
    return MARGIN;
  }
  return y;
}

function drawPlainTableHeader(
  pdf: jsPDF,
  y: number,
  cols: Array<{ label: string; x: number; align?: "left" | "right" | "center" }>,
) {
  rgb(pdf, INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  for (const col of cols) {
    pdf.text(col.label, col.x, y, { align: col.align ?? "left" });
  }
  strokeInk(pdf);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
  return y + 8;
}

function drawSummaryPage(pdf: jsPDF, doc: SalesReportDocument) {
  let y = drawPageHeader(pdf, {
    title: "Daily Sales Report",
    subtitle: `${PRODUCT_NAME}  ·  ${doc.storeName}  ·  ${doc.dateLabel}`,
  });

  rgb(pdf, INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Total orders", MARGIN, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(String(doc.orderCount), PAGE_W - MARGIN, y, { align: "right" });
  y += 7;

  pdf.setFont("helvetica", "bold");
  pdf.text("Total sales", MARGIN, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(formatAmountPlain(doc.totalSales), PAGE_W - MARGIN, y, {
    align: "right",
  });
  y += 12;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Item sales", MARGIN, y);
  y += 7;
  y = drawPlainTableHeader(pdf, y, [
    { label: "Item", x: MARGIN },
    { label: "Qty", x: PAGE_W - MARGIN, align: "right" },
  ]);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  if (doc.itemSales.length === 0) {
    rgb(pdf, MUTED);
    pdf.text("No items sold", MARGIN, y);
    y += 7;
  } else {
    for (const item of doc.itemSales) {
      y = ensureSpace(pdf, y, 7);
      rgb(pdf, INK);
      pdf.text(item.name, MARGIN, y);
      pdf.text(String(item.quantity), PAGE_W - MARGIN, y, { align: "right" });
      y += 6.5;
    }
  }

  y += 8;
  y = ensureSpace(pdf, y, 30);
  rgb(pdf, INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Payment summary", MARGIN, y);
  y += 7;
  y = drawPlainTableHeader(pdf, y, [
    { label: "Method", x: MARGIN },
    { label: "Amount", x: PAGE_W - MARGIN, align: "right" },
  ]);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const paymentRows: Array<{ label: string; amount: number }> = [
    ...doc.paymentPaid.map((row) => ({
      label: PAYMENT_METHOD_LABELS[row.method],
      amount: row.amount,
    })),
  ];
  if (doc.unpaidAmount > 0) {
    paymentRows.push({ label: "Unpaid", amount: doc.unpaidAmount });
  }

  if (paymentRows.length === 0) {
    rgb(pdf, MUTED);
    pdf.text("No payments", MARGIN, y);
  } else {
    for (const row of paymentRows) {
      y = ensureSpace(pdf, y, 7);
      rgb(pdf, INK);
      pdf.text(row.label, MARGIN, y);
      pdf.text(formatAmountPlain(row.amount), PAGE_W - MARGIN, y, {
        align: "right",
      });
      y += 6.5;
    }
  }

  drawFooter(pdf);
}

function drawIndexPages(pdf: jsPDF, doc: SalesReportDocument) {
  pdf.addPage();
  let y = drawPageHeader(pdf, {
    title: "Order Index",
    subtitle: `${PRODUCT_NAME}  ·  ${doc.storeName}  ·  ${doc.dateLabel}`,
  });

  const cols = [
    { label: "Order", x: MARGIN },
    { label: "Items", x: MARGIN + 28 },
    { label: "Amount", x: PAGE_W - MARGIN, align: "right" as const },
  ];
  y = drawPlainTableHeader(pdf, y, cols);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  if (doc.index.length === 0) {
    rgb(pdf, MUTED);
    pdf.text("No orders for this date.", MARGIN, y);
    drawFooter(pdf);
    return;
  }

  for (const row of doc.index) {
    const itemLines = pdf.splitTextToSize(row.itemsSummary, CONTENT_W - 55) as string[];
    const blockH = Math.max(itemLines.length, 1) * 4.2 + 2;
    y = ensureSpace(pdf, y, blockH);

    if (y <= MARGIN + 1) {
      rgb(pdf, INK);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Order Index (continued)", MARGIN, y);
      y += 7;
      y = drawPlainTableHeader(pdf, y, cols);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    }

    rgb(pdf, INK);
    pdf.setFont("helvetica", "bold");
    pdf.text(`#${row.orderNumber}`, MARGIN, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(itemLines, MARGIN + 28, y);
    pdf.text(formatAmountPlain(row.amount), PAGE_W - MARGIN, y, {
      align: "right",
    });
    y += blockH;
  }

  drawFooter(pdf);
}

/** Same thermal receipt UI as the single-order download, centered on A4. */
function drawReceiptPage(pdf: jsPDF, receipt: ReceiptDocument) {
  pdf.addPage();
  const canvas = renderReceiptCanvas(receipt);
  const dataUrl = canvas.toDataURL("image/png");
  const maxH = PAGE_H - MARGIN * 2;
  let widthMm = 70;
  let heightMm = (canvas.height / RECEIPT_WIDTH_PX) * widthMm;
  if (heightMm > maxH) {
    widthMm = (maxH / heightMm) * widthMm;
    heightMm = maxH;
  }
  const x = (PAGE_W - widthMm) / 2;
  const y = MARGIN + Math.max(0, (maxH - heightMm) / 2);
  pdf.addImage(dataUrl, "PNG", x, y, widthMm, heightMm);
}

export async function downloadSalesReportPdf(doc: SalesReportDocument) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  drawSummaryPage(pdf, doc);
  drawIndexPages(pdf, doc);
  for (const receipt of doc.receipts) {
    drawReceiptPage(pdf, receipt);
  }

  const blob = pdf.output("blob");
  const store = slugPart(doc.storeName) || "store";
  triggerDownload(blob, `${store}-sales-${doc.dateKey}.pdf`);
}
