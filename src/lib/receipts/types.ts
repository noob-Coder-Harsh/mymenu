import type { PaymentMethod, PaymentStatus } from "@/lib/types/database";

export type ReceiptLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptDocument = {
  storeName: string;
  storePhone: string | null;
  orderNumber: string;
  createdAtIso: string;
  isTakeaway: boolean;
  items: ReceiptLine[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string | null;
  thankYou: string;
};

export type SalesItemQty = {
  name: string;
  quantity: number;
};

export type SalesPaymentTotal = {
  method: PaymentMethod;
  amount: number;
};

export type SalesOrderIndexRow = {
  orderNumber: string;
  itemsSummary: string;
  amount: number;
};

export type SalesReportDocument = {
  storeName: string;
  dateKey: string;
  dateLabel: string;
  orderCount: number;
  totalSales: number;
  itemSales: SalesItemQty[];
  paymentPaid: SalesPaymentTotal[];
  unpaidAmount: number;
  index: SalesOrderIndexRow[];
  receipts: ReceiptDocument[];
};
