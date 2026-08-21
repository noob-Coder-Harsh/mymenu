import { jsonError } from "@/lib/http";
import { placeOrder } from "@/lib/orders/place-order";
import type { PaymentMethod } from "@/lib/types/database";

export async function POST(request: Request) {
  let body: {
    slug?: string;
    customer_name?: string;
    customer_phone?: string;
    payment_method?: PaymentMethod;
    notes?: string;
    is_takeaway?: boolean;
    items?: { menu_item_variant_id?: string; quantity?: number }[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const result = await placeOrder({
    slug: body.slug?.trim() ?? "",
    customerName: body.customer_name ?? "",
    customerPhone: body.customer_phone ?? "",
    paymentMethod: body.payment_method ?? "cash",
    notes: body.notes ?? "",
    isTakeaway: body.is_takeaway === true,
    items: (body.items ?? []).map((item) => ({
      menuItemVariantId: item.menu_item_variant_id ?? "",
      quantity: item.quantity ?? 0,
    })),
  });

  if (!result.ok) {
    return jsonError(result.message, result.status);
  }

  return Response.json(result.data, { status: 201 });
}
