import { getPublicOrder, getPublicStoreBySlug } from "@/lib/catalog/public-store";
import { jsonError } from "@/lib/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const slug = new URL(request.url).searchParams.get("slug")?.trim() ?? "";
  if (!slug) {
    return jsonError("Missing store", 400);
  }

  const catalog = await getPublicStoreBySlug(slug);
  if (!catalog) {
    return jsonError("Store not found", 404);
  }

  const order = await getPublicOrder(catalog.store.id, orderId);
  if (!order) {
    return jsonError("Order not found", 404);
  }

  return Response.json({
    store: {
      name: catalog.store.name,
      slug: catalog.store.slug,
      upi_id: catalog.store.upi_id,
    },
    ...order,
  });
}
