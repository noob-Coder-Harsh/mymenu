export type CartLine = {
  variantId: string;
  quantity: number;
};

export type StoredCart = {
  lines: CartLine[];
  notes: string;
};

export function cartStorageKey(slug: string) {
  return `foodbaba:cart:v2:${slug}`;
}

function parseLine(line: unknown): CartLine | null {
  if (typeof line !== "object" || !line) {
    return null;
  }
  const candidate = line as Partial<CartLine> & { menuItemId?: string };
  // Ignore legacy v1 carts keyed by menuItemId
  if (typeof candidate.variantId !== "string" || typeof candidate.quantity !== "number") {
    return null;
  }
  const quantity = Math.floor(candidate.quantity);
  if (quantity < 1 || quantity > 20) {
    return null;
  }
  return { variantId: candidate.variantId, quantity };
}

function parseLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(parseLine).filter((line): line is CartLine => line !== null);
}

export function parseCart(raw: string | null): StoredCart {
  if (!raw) {
    return { lines: [], notes: "" };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { lines: parseLines(parsed), notes: "" };
    }
    if (typeof parsed === "object" && parsed) {
      const record = parsed as { lines?: unknown; notes?: unknown };
      return {
        lines: parseLines(record.lines),
        notes: typeof record.notes === "string" ? record.notes.slice(0, 300) : "",
      };
    }
    return { lines: [], notes: "" };
  } catch {
    return { lines: [], notes: "" };
  }
}

export function parseCartLines(raw: string | null): CartLine[] {
  return parseCart(raw).lines;
}
