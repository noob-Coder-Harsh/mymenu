menu_categories
    id
    store_id
    name
    description
    icon
    sort_order
    is_active
    created_at
    updated_at

menu_items
    id
    store_id
    category_id
    name
    description
    image_url
    sort_order
    is_available
    is_active
    created_at
    updated_at

menu_item_variants
    id
    menu_item_id
    name
    price
    sort_order
    is_available
    created_at
    updated_at





    Build the merchant menu creation UX around the mental model of a simple printed food-cart menu, not a complex product-management system. A merchant should be able to open “My Menu”, tap “Add Item”, choose or create a category, enter the item name and price, and save it in a few seconds. If an item has multiple prices, provide a simple optional “Different prices?” toggle that reveals price options such as Small/Medium/Large, Half/Full, 1 Pc/2 Pc, etc.; never expose technical terms like “variant”. Let merchants add categories and items inline without navigating through separate management screens. Keep forms mobile-first, large, touch-friendly, minimal in English, and use familiar labels such as Item name, Price, Add price, Category, Available. After saving, show the menu visually grouped by categories like a physical laminated menu, with quick actions to edit, hide/show availability, reorder, and add another item. Optimize for a tea-stall, momo cart, juice shop, or small café owner who may have very little technical knowledge: one decision at a time, sensible defaults, minimal typing, no unnecessary fields, and no requirement to understand how the database works.