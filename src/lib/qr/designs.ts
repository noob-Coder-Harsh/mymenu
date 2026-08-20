export const QR_DESIGN_IDS = ["classic", "bold", "minimal", "stamp"] as const;

export type QrDesignId = (typeof QR_DESIGN_IDS)[number];

export const DEFAULT_QR_DESIGN: QrDesignId = "classic";

export type QrDesignMeta = {
  id: QrDesignId;
  label: string;
  blurb: string;
};

export const QR_DESIGNS: QrDesignMeta[] = [
  {
    id: "classic",
    label: "Classic",
    blurb: "Warm café poster — default for print",
  },
  {
    id: "bold",
    label: "Bold",
    blurb: "Dark counter sign, easy to spot",
  },
  {
    id: "minimal",
    label: "Minimal",
    blurb: "Clean white card for tables",
  },
  {
    id: "stamp",
    label: "Stamp",
    blurb: "Accent frame for windows & walls",
  },
];

export function isQrDesignId(value: string): value is QrDesignId {
  return (QR_DESIGN_IDS as readonly string[]).includes(value);
}
