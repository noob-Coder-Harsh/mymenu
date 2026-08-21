import { PRODUCT_NAME } from "@/lib/constants";
import { formatAmountPlain } from "@/lib/money";
import type { ReceiptDocument } from "@/lib/receipts/types";
import { formatReceiptDateTimeIst } from "@/lib/time";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types/labels";

/** ~58mm thermal width at ~203 dpi */
export const RECEIPT_WIDTH_PX = 384;
const PAD_X = 16;
const COL_QTY_RIGHT = 78; // distance from right edge to qty column center
const COL_AMT_RIGHT = 16; // distance from right edge to amount (right-aligned)
const ROW_H = 18;

function fitOneLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  const ellipsis = "…";
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = `${text.slice(0, mid)}${ellipsis}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low === 0 ? ellipsis : `${text.slice(0, low)}${ellipsis}`;
}

function drawRule(ctx: CanvasRenderingContext2D, y: number, solid = false) {
  ctx.save();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 1;
  if (!solid) {
    ctx.setLineDash([3, 3]);
  }
  ctx.beginPath();
  ctx.moveTo(PAD_X, y);
  ctx.lineTo(RECEIPT_WIDTH_PX - PAD_X, y);
  ctx.stroke();
  ctx.restore();
  return y + 10;
}

function drawCenteredLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  font: string,
) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#111827";
  ctx.fillText(text, RECEIPT_WIDTH_PX / 2, y);
  ctx.restore();
  return y + 18;
}

function colPositions() {
  const itemX = PAD_X;
  const qtyX = RECEIPT_WIDTH_PX - COL_QTY_RIGHT;
  const amtX = RECEIPT_WIDTH_PX - COL_AMT_RIGHT;
  // Leave a clear gap before the qty column so names never cover amounts.
  const itemMaxW = qtyX - 20 - itemX;
  return { itemX, qtyX, amtX, itemMaxW };
}

function drawTableHeader(ctx: CanvasRenderingContext2D, y: number) {
  const { itemX, qtyX, amtX } = colPositions();
  ctx.save();
  ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#111827";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("Item", itemX, y);
  ctx.textAlign = "center";
  ctx.fillText("Qty", qtyX, y);
  ctx.textAlign = "right";
  ctx.fillText("Amt", amtX, y);
  ctx.restore();
  return drawRule(ctx, y + 14, true);
}

function drawItemRow(
  ctx: CanvasRenderingContext2D,
  y: number,
  name: string,
  qty: number,
  amount: number,
) {
  const { itemX, qtyX, amtX, itemMaxW } = colPositions();
  ctx.save();
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#111827";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(fitOneLine(ctx, name, itemMaxW), itemX, y);
  ctx.textAlign = "center";
  ctx.fillText(String(qty), qtyX, y);
  ctx.textAlign = "right";
  ctx.fillText(formatAmountPlain(amount), amtX, y);
  ctx.restore();
  return y + ROW_H;
}

function measureReceiptHeight(receipt: ReceiptDocument): number {
  const canvas = document.createElement("canvas");
  canvas.width = RECEIPT_WIDTH_PX;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return 600;
  }
  return paintReceipt(ctx, receipt, true);
}

function paintReceipt(
  ctx: CanvasRenderingContext2D,
  receipt: ReceiptDocument,
  measureOnly: boolean,
): number {
  let y = 22;

  if (!measureOnly) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, RECEIPT_WIDTH_PX, ctx.canvas.height);
  }

  y = drawCenteredLine(
    ctx,
    receipt.storeName,
    y,
    "bold 18px ui-sans-serif, system-ui, sans-serif",
  );
  y = drawCenteredLine(
    ctx,
    `Powered by ${PRODUCT_NAME}`,
    y - 2,
    "10px ui-sans-serif, system-ui, sans-serif",
  );
  y += 2;
  y = drawRule(ctx, y);

  ctx.save();
  ctx.fillStyle = "#111827";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = "bold 13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`Order #${receipt.orderNumber}`, PAD_X, y);
  y += 16;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(formatReceiptDateTimeIst(receipt.createdAtIso), PAD_X, y);
  y += 14;
  ctx.fillText(receipt.isTakeaway ? "Takeaway" : "Eat in", PAD_X, y);
  ctx.restore();
  y += 16;

  y = drawRule(ctx, y);
  y = drawTableHeader(ctx, y);

  for (const item of receipt.items) {
    y = drawItemRow(ctx, y, item.name, item.quantity, item.lineTotal);
  }

  y = drawRule(ctx, y, true);

  ctx.save();
  ctx.fillStyle = "#111827";
  ctx.textBaseline = "top";
  ctx.font = "bold 14px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Total", PAD_X, y);
  ctx.textAlign = "right";
  ctx.fillText(
    formatAmountPlain(receipt.totalAmount),
    RECEIPT_WIDTH_PX - PAD_X,
    y,
  );
  ctx.restore();
  y += 20;

  ctx.save();
  ctx.fillStyle = "#111827";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(
    `${PAYMENT_METHOD_LABELS[receipt.paymentMethod]} · ${PAYMENT_STATUS_LABELS[receipt.paymentStatus]}`,
    PAD_X,
    y,
  );
  ctx.restore();
  y += 16;

  if (receipt.notes) {
    y = drawRule(ctx, y);
    ctx.save();
    ctx.fillStyle = "#111827";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    const note = fitOneLine(
      ctx,
      `Note: ${receipt.notes}`,
      RECEIPT_WIDTH_PX - PAD_X * 2,
    );
    ctx.fillText(note, PAD_X, y);
    ctx.restore();
    y += 16;
  }

  y = drawRule(ctx, y);
  y = drawCenteredLine(
    ctx,
    receipt.thankYou,
    y,
    "11px ui-sans-serif, system-ui, sans-serif",
  );
  y = drawCenteredLine(
    ctx,
    PRODUCT_NAME,
    y - 2,
    "9px ui-sans-serif, system-ui, sans-serif",
  );
  y += 10;

  return y;
}

export function renderReceiptCanvas(receipt: ReceiptDocument): HTMLCanvasElement {
  const height = Math.ceil(measureReceiptHeight(receipt));
  const canvas = document.createElement("canvas");
  canvas.width = RECEIPT_WIDTH_PX;
  canvas.height = Math.max(height, 200);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create receipt canvas");
  }
  paintReceipt(ctx, receipt, false);
  return canvas;
}

export async function receiptCanvasToPngBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not encode receipt image"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}
