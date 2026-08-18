import type { MenuItem } from "@/lib/types/database";

export type MenuItemView = Omit<MenuItem, "price"> & { price: number };
