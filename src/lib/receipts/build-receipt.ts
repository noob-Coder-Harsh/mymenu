import type { ReceiptDocument, ReceiptLine } from "@/lib/receipts/types";
import type { PaymentMethod, PaymentStatus } from "@/lib/types/database";

export type ReceiptOrderInput = {
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

export type ReceiptStoreInput = {
  name: string;
  phone?: string | null;
};

const THANK_YOU = "Thank you! Visit again.";

export function buildReceiptDocument(
  order: ReceiptOrderInput,
  store: ReceiptStoreInput,
): ReceiptDocument {
  const items: ReceiptLine[] = order.items.map((item) => ({
    name: item.item_name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    lineTotal: item.total_amount,
  }));

  return {
    storeName: store.name,
    storePhone: null,
    orderNumber: order.order_number,
    createdAtIso: order.created_at,
    isTakeaway: order.is_takeaway,
    items,
    totalAmount: order.total_amount,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    notes: order.notes,
    thankYou: THANK_YOU,
  };
}

export function summarizeReceiptItems(
  items: Array<{ item_name: string; quantity: number }>,
  maxLen = 42,
) {
  const parts = items.map((item) => `${item.item_name} × ${item.quantity}`);
  const joined = parts.join(", ");
  if (joined.length <= maxLen) {
    return joined || "—";
  }
  return `${joined.slice(0, maxLen - 1)}…`;
}
