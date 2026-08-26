export type OrderSource = "counter" | "qr" | "phone" | "other";
export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
export type PaymentMethod = "upi" | "cash" | "card" | "other";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type DevicePlatform = "ios" | "android" | "web";

export type User = {
  id: string;
  firebase_uid: string;
  name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Store = {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  logo_url: string | null;
  upi_id: string | null;
  is_open: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreSettings = {
  id: string;
  store_id: string;
  currency: string;
  order_prefix: string;
  customer_phone_required: boolean;
  order_notifications_enabled: boolean;
  auto_accept_orders: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuCategory = {
  id: string;
  store_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItem = {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItemVariant = {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  sort_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  store_id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  order_source: OrderSource;
  order_status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  total_amount: number;
  is_takeaway: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  menu_item_variant_id: string | null;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_amount: number;
  created_at: string;
};

export type DeviceToken = {
  id: string;
  user_id: string;
  store_id: string;
  device_id: string;
  token: string;
  platform: DevicePlatform;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerOrderToken = {
  id: string;
  store_id: string;
  order_id: string;
  device_id: string;
  token: string;
  platform: DevicePlatform;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      users: Table<
        User,
        Partial<User> & Pick<User, "firebase_uid" | "name" | "phone">,
        Partial<User>
      >;
      stores: Table<
        Store,
        Partial<Store> & Pick<Store, "owner_user_id" | "name" | "slug">,
        Partial<Store>
      >;
      store_settings: Table<
        StoreSettings,
        Partial<StoreSettings> & Pick<StoreSettings, "store_id">,
        Partial<StoreSettings>
      >;
      menu_categories: Table<
        MenuCategory,
        Partial<MenuCategory> & Pick<MenuCategory, "store_id" | "name">,
        Partial<MenuCategory>
      >;
      menu_items: Table<
        MenuItem,
        Partial<MenuItem> & Pick<MenuItem, "store_id" | "name">,
        Partial<MenuItem>
      >;
      menu_item_variants: Table<
        MenuItemVariant,
        Partial<MenuItemVariant> &
          Pick<MenuItemVariant, "menu_item_id" | "price">,
        Partial<MenuItemVariant>
      >;
      orders: Table<
        Order,
        Partial<Order> & Pick<Order, "store_id" | "order_number">,
        Partial<Order>
      >;
      order_items: Table<
        OrderItem,
        Partial<OrderItem> &
          Pick<
            OrderItem,
            "order_id" | "item_name" | "unit_price" | "quantity" | "total_amount"
          >,
        Partial<OrderItem>
      >;
      device_tokens: Table<
        DeviceToken,
        Partial<DeviceToken> &
          Pick<
            DeviceToken,
            "user_id" | "store_id" | "device_id" | "token" | "platform"
          >,
        Partial<DeviceToken>
      >;
      customer_order_tokens: Table<
        CustomerOrderToken,
        Partial<CustomerOrderToken> &
          Pick<
            CustomerOrderToken,
            "store_id" | "order_id" | "device_id" | "token" | "platform"
          >,
        Partial<CustomerOrderToken>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_source: OrderSource;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      device_platform: DevicePlatform;
    };
    CompositeTypes: Record<string, never>;
  };
};
