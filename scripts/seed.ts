import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { DEMO_IDS, DEMO_STORE_SLUG } from "../src/lib/constants";
import type { Database } from "../src/lib/types/database";

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  const { error: userError } = await supabase.from("users").upsert({
    id: DEMO_IDS.user,
    firebase_uid: "demo-firebase-uid-brew-cafe",
    name: "Demo Owner",
    phone: "+919999999999",
    email: "demo@foodbaba.local",
    is_active: true,
  });
  if (userError) {
    throw userError;
  }

  const { error: storeError } = await supabase.from("stores").upsert({
    id: DEMO_IDS.store,
    owner_user_id: DEMO_IDS.user,
    name: "Brew Cafe",
    slug: DEMO_STORE_SLUG,
    description: "Demo coffee cart for FoodBaba MVP.",
    phone: "+919999999999",
    upi_id: "brewcafe@upi",
    is_open: true,
    is_active: true,
  });
  if (storeError) {
    throw storeError;
  }

  const { error: settingsError } = await supabase
    .from("store_settings")
    .update({
      currency: "INR",
      order_prefix: "FD",
      customer_phone_required: true,
      order_notifications_enabled: true,
      auto_accept_orders: false,
    })
    .eq("store_id", DEMO_IDS.store);
  if (settingsError) {
    throw settingsError;
  }

  const { error: categoryError } = await supabase.from("menu_categories").upsert([
    {
      id: DEMO_IDS.categoryCoffee,
      store_id: DEMO_IDS.store,
      name: "Coffee",
      sort_order: 0,
      is_active: true,
    },
    {
      id: DEMO_IDS.categorySnacks,
      store_id: DEMO_IDS.store,
      name: "Snacks",
      sort_order: 1,
      is_active: true,
    },
  ]);
  if (categoryError) {
    throw categoryError;
  }

  const { error: itemError } = await supabase.from("menu_items").upsert([
    {
      id: DEMO_IDS.itemCappuccino,
      store_id: DEMO_IDS.store,
      category_id: DEMO_IDS.categoryCoffee,
      name: "Cappuccino",
      description: "Creamy espresso with steamed milk.",
      price: 120,
      sort_order: 0,
      is_available: true,
      is_active: true,
    },
    {
      id: DEMO_IDS.itemLatte,
      store_id: DEMO_IDS.store,
      category_id: DEMO_IDS.categoryCoffee,
      name: "Latte",
      description: "Smooth espresso with extra milk.",
      price: 140,
      sort_order: 1,
      is_available: true,
      is_active: true,
    },
    {
      id: DEMO_IDS.itemAmericano,
      store_id: DEMO_IDS.store,
      category_id: DEMO_IDS.categoryCoffee,
      name: "Americano",
      description: "Espresso with hot water.",
      price: 100,
      sort_order: 2,
      is_available: true,
      is_active: true,
    },
    {
      id: DEMO_IDS.itemSandwich,
      store_id: DEMO_IDS.store,
      category_id: DEMO_IDS.categorySnacks,
      name: "Veg Sandwich",
      description: "Toasted sandwich with fresh veggies.",
      price: 180,
      sort_order: 0,
      is_available: true,
      is_active: true,
    },
    {
      id: DEMO_IDS.itemFries,
      store_id: DEMO_IDS.store,
      category_id: DEMO_IDS.categorySnacks,
      name: "Fries",
      description: "Crispy salted fries.",
      price: 120,
      sort_order: 1,
      is_available: false,
      is_active: true,
    },
  ]);
  if (itemError) {
    throw itemError;
  }

  console.log(`Seeded demo store /s/${DEMO_STORE_SLUG}`);
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
