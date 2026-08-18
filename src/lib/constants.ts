export const PRODUCT_NAME = "FoodBaba";
export const DEMO_STORE_SLUG = "brew-cafe";

export const DEMO_IDS = {
  user: "11111111-1111-1111-1111-111111111111",
  store: "22222222-2222-2222-2222-222222222222",
  categoryCoffee: "33333333-3333-3333-3333-333333333331",
  categorySnacks: "33333333-3333-3333-3333-333333333332",
  itemCappuccino: "44444444-4444-4444-4444-444444444441",
  itemLatte: "44444444-4444-4444-4444-444444444442",
  itemAmericano: "44444444-4444-4444-4444-444444444443",
  itemSandwich: "44444444-4444-4444-4444-444444444444",
  itemFries: "44444444-4444-4444-4444-444444444445",
} as const;

export const STORE_ASSETS_BUCKET = "store-assets";

export const MERCHANT_NAV = [
  { href: "/merchant", label: "Home", exact: true },
  { href: "/merchant/orders", label: "Orders", exact: false },
  { href: "/merchant/menu", label: "Menu", exact: false },
  { href: "/merchant/store", label: "Store", exact: false },
] as const;
