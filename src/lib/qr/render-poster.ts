import QRCode from "qrcode";
import { DEFAULT_QR_DESIGN, type QrDesignId } from "./designs";

export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1350;

export type PosterInput = {
  designId?: QrDesignId;
  storeName: string;
  menuUrl: string;
  productName: string;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize = 28,
) {
  let size = maxSize;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
  }
  return size;
}

function wrapCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });
  return lines.length;
}

async function loadQrImage(menuUrl: string, size: number, dark: string, light: string) {
  const dataUrl = await QRCode.toDataURL(menuUrl, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark, light },
  });
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  return image;
}

function drawClassic(
  ctx: CanvasRenderingContext2D,
  input: PosterInput,
  qr: HTMLImageElement,
) {
  ctx.fillStyle = "#fffdf9";
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  ctx.fillStyle = "#c45c26";
  ctx.fillRect(0, 0, POSTER_WIDTH, 140);

  ctx.fillStyle = "#fffdf9";
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(input.productName.toUpperCase(), POSTER_WIDTH / 2, 82);

  ctx.fillStyle = "#2c1810";
  const nameSize = fitText(ctx, input.storeName, 860, 72, 36);
  ctx.font = `700 ${nameSize}px system-ui, sans-serif`;
  wrapCentered(ctx, input.storeName, POSTER_WIDTH / 2, 260, 860, nameSize + 10);

  const qrSize = 620;
  const qrX = (POSTER_WIDTH - qrSize) / 2;
  const qrY = 360;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, qrX - 36, qrY - 36, qrSize + 72, qrSize + 72, 36);
  ctx.fill();
  ctx.strokeStyle = "#eadfd6";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#c45c26";
  ctx.font = "700 42px system-ui, sans-serif";
  ctx.fillText("Scan to order", POSTER_WIDTH / 2, 1100);

  ctx.fillStyle = "#8a7468";
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.fillText("Open the menu on your phone", POSTER_WIDTH / 2, 1160);

  ctx.fillStyle = "#eadfd6";
  ctx.fillRect(120, 1220, POSTER_WIDTH - 240, 3);
  ctx.fillStyle = "#8a7468";
  ctx.font = "500 24px system-ui, sans-serif";
  ctx.fillText(`Powered by ${input.productName}`, POSTER_WIDTH / 2, 1280);
}

function drawBold(
  ctx: CanvasRenderingContext2D,
  input: PosterInput,
  qr: HTMLImageElement,
) {
  ctx.fillStyle = "#1a120e";
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  ctx.fillStyle = "#c45c26";
  ctx.fillRect(0, 0, POSTER_WIDTH, 18);

  ctx.fillStyle = "#fffdf9";
  const nameSize = fitText(ctx, input.storeName, 900, 78, 40);
  ctx.font = `700 ${nameSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  wrapCentered(ctx, input.storeName, POSTER_WIDTH / 2, 160, 900, nameSize + 12);

  ctx.fillStyle = "#c9b5a8";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText("SCAN · ORDER · PAY HERE", POSTER_WIDTH / 2, 250);

  const qrSize = 680;
  const qrX = (POSTER_WIDTH - qrSize) / 2;
  const qrY = 320;
  ctx.fillStyle = "#fffdf9";
  roundRect(ctx, qrX - 28, qrY - 28, qrSize + 56, qrSize + 56, 28);
  ctx.fill();
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#c45c26";
  roundRect(ctx, 160, 1100, POSTER_WIDTH - 320, 100, 50);
  ctx.fill();
  ctx.fillStyle = "#fffdf9";
  ctx.font = "700 40px system-ui, sans-serif";
  ctx.fillText("Scan for menu", POSTER_WIDTH / 2, 1164);

  ctx.fillStyle = "#8a7468";
  ctx.font = "500 24px system-ui, sans-serif";
  ctx.fillText(input.productName, POSTER_WIDTH / 2, 1280);
}

function drawMinimal(
  ctx: CanvasRenderingContext2D,
  input: PosterInput,
  qr: HTMLImageElement,
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  ctx.strokeStyle = "#eadfd6";
  ctx.lineWidth = 8;
  roundRect(ctx, 48, 48, POSTER_WIDTH - 96, POSTER_HEIGHT - 96, 40);
  ctx.stroke();

  ctx.fillStyle = "#8a7468";
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MENU", POSTER_WIDTH / 2, 180);

  ctx.fillStyle = "#2c1810";
  const nameSize = fitText(ctx, input.storeName, 820, 64, 34);
  ctx.font = `600 ${nameSize}px system-ui, sans-serif`;
  wrapCentered(ctx, input.storeName, POSTER_WIDTH / 2, 250, 820, nameSize + 10);

  const qrSize = 640;
  const qrX = (POSTER_WIDTH - qrSize) / 2;
  const qrY = 360;
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#2c1810";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.fillText("Scan to view menu & order", POSTER_WIDTH / 2, 1120);

  ctx.fillStyle = "#8a7468";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText(input.productName, POSTER_WIDTH / 2, 1240);
}

function drawStamp(
  ctx: CanvasRenderingContext2D,
  input: PosterInput,
  qr: HTMLImageElement,
) {
  const gradient = ctx.createLinearGradient(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  gradient.addColorStop(0, "#f7f3ee");
  gradient.addColorStop(1, "#efe4d8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  ctx.strokeStyle = "#c45c26";
  ctx.lineWidth = 16;
  roundRect(ctx, 56, 56, POSTER_WIDTH - 112, POSTER_HEIGHT - 112, 48);
  ctx.stroke();
  ctx.lineWidth = 4;
  roundRect(ctx, 84, 84, POSTER_WIDTH - 168, POSTER_HEIGHT - 168, 36);
  ctx.stroke();

  ctx.fillStyle = "#c45c26";
  roundRect(ctx, POSTER_WIDTH / 2 - 120, 130, 240, 64, 32);
  ctx.fill();
  ctx.fillStyle = "#fffdf9";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ORDER HERE", POSTER_WIDTH / 2, 172);

  ctx.fillStyle = "#2c1810";
  const nameSize = fitText(ctx, input.storeName, 800, 68, 36);
  ctx.font = `700 ${nameSize}px system-ui, sans-serif`;
  wrapCentered(ctx, input.storeName, POSTER_WIDTH / 2, 280, 800, nameSize + 10);

  const qrSize = 600;
  const qrX = (POSTER_WIDTH - qrSize) / 2;
  const qrY = 380;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, qrX - 28, qrY - 28, qrSize + 56, qrSize + 56, 28);
  ctx.fill();
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#c45c26";
  ctx.font = "700 38px system-ui, sans-serif";
  ctx.fillText("Point camera · Open menu", POSTER_WIDTH / 2, 1120);

  ctx.fillStyle = "#8a7468";
  ctx.font = "500 24px system-ui, sans-serif";
  ctx.fillText(input.productName, POSTER_WIDTH / 2, 1240);
}

export async function renderQrPoster(input: PosterInput): Promise<HTMLCanvasElement> {
  const designId = input.designId ?? DEFAULT_QR_DESIGN;
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create poster");
  }

  const qrColors =
    designId === "bold"
      ? { dark: "#1a120e", light: "#fffdf9" }
      : { dark: "#2c1810", light: "#ffffff" };

  const qr = await loadQrImage(input.menuUrl, 720, qrColors.dark, qrColors.light);

  switch (designId) {
    case "bold":
      drawBold(ctx, input, qr);
      break;
    case "minimal":
      drawMinimal(ctx, input, qr);
      break;
    case "stamp":
      drawStamp(ctx, input, qr);
      break;
    case "classic":
    default:
      drawClassic(ctx, input, qr);
      break;
  }

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not export image"));
        return;
      }
      resolve(blob);
    }, type);
  });
}
