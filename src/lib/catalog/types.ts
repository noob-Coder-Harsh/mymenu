import type { MenuCategory, Store, StoreSettings } from "@/lib/types/database";
import type { MenuItemView } from "@/lib/menu/types";

export type PublicCatalog = {
  store: Store;
  settings: StoreSettings;
  categories: MenuCategory[];
  items: MenuItemView[];
};
