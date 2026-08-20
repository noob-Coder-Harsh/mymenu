import { parsePrice } from "@/lib/money";

export type PriceInput = {
  id?: string;
  name?: string;
  price?: number | string;
  is_available?: boolean;
};

export type ParsedPriceRow = {
  id?: string;
  name: string;
  price: number;
  is_available: boolean;
};

export function parsePriceRows(
  prices: unknown,
): { ok: true; rows: ParsedPriceRow[] } | { ok: false; message: string } {
  if (!Array.isArray(prices) || prices.length === 0) {
    return { ok: false, message: "Add at least one price" };
  }
  if (prices.length > 20) {
    return { ok: false, message: "Too many prices" };
  }

  const rows: ParsedPriceRow[] = [];
  for (const entry of prices) {
    if (typeof entry !== "object" || !entry) {
      return { ok: false, message: "Invalid price row" };
    }
    const row = entry as PriceInput;
    const price = parsePrice(row.price);
    if (price === null) {
      return { ok: false, message: "Enter a valid price" };
    }
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (prices.length > 1 && !name) {
      return { ok: false, message: "Name each price (e.g. Small, Large)" };
    }
    rows.push({
      id: typeof row.id === "string" && row.id ? row.id : undefined,
      name,
      price,
      is_available: typeof row.is_available === "boolean" ? row.is_available : true,
    });
  }

  return { ok: true, rows };
}
