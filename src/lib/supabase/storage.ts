import { STORE_ASSETS_BUCKET } from "@/lib/constants";

export { STORE_ASSETS_BUCKET };

export function storeAssetPath(
  storeId: string,
  kind: "logo" | "item",
  fileName: string,
) {
  return `${storeId}/${kind}/${fileName}`;
}
