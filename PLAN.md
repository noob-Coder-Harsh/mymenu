Implement a Daily Sales Report feature for the merchant side of FoodBaba.

IMPORTANT CONTEXT
This feature is meant for small food/beverage businesses such as a cold coffee cart, tea cart, momos cart, etc. The real-world use case is that a worker takes customer orders throughout the day, and later the shop owner/partner wants a simple document containing the day's complete sales information. The owner should be able to quickly verify the day's हिसाब from the summary, and if there is any doubt, inspect the order index or the individual receipt.

This is NOT a multi-cart feature.
This is NOT an opening/closing/day-closing workflow.
Do NOT introduce concepts such as "Open Day", "Close Day", "Closing", "Shift", or mandatory end-of-day confirmation.

The core workflow is simply:

SELECT DATE → VIEW SALES → GENERATE PDF

FEATURE REQUIREMENTS

1. DATE-BASED SALES REPORT

Add a merchant-side sales report functionality where the merchant can select a date.

Default date should be TODAY.

The report should fetch all relevant orders for that store for the selected date using the existing order/order-item/payment data and existing business logic.

Do not duplicate business logic unnecessarily. Reuse the current order, order item, product, variant, pricing and payment models/services/repositories where possible.

The merchant should be able to change the date, for example:

- Today
- Yesterday
- Custom date

The primary use case is "Today".

2. REPORT SUMMARY

The generated PDF must start with a summary page.

Example:

FOODBABA
DAILY SALES REPORT

Cold Coffee Cart
21 August 2026

TOTAL ORDERS
50

TOTAL SALES
₹5,840

ITEM SALES
Cold Coffee        67
Mojito             31
Momos              44 plates
French Fries       19
Water Bottle        7

PAYMENT SUMMARY
Cash               ₹3,200
UPI                ₹2,640

The exact fields should be based on what is already available in the current codebase.

The most important summary is ITEM QUANTITY SOLD.

For example, if there were 50 orders but customers bought 67 cold coffees in total, the report should say:

Cold Coffee — 67

Do NOT simply count how many orders contained Cold Coffee.

Aggregate actual order-item quantities.

The summary should help the owner answer:

"What did we sell today and how much?"

3. ORDER INDEX PAGE

After the summary, generate an order index.

The index should contain one compact row per order.

Example:

ORDER INDEX
21 August 2026

Order     Items                                      Amount
#001      Cold Coffee × 2                            ₹180
#002      Momos × 1                                  ₹120
#003      Cold Coffee × 1, Mojito × 1               ₹200
#004      French Fries × 2                           ₹240
#005      Cold Coffee × 3                            ₹270
...
#050      Mojito × 2                                 ₹240

The index is intended for quick verification.

The receiving person should be able to look through the index and understand individual order contents without opening every receipt.

Keep this page compact and printable.

If there are many orders, automatically continue the index onto additional pages.

4. INDIVIDUAL RECEIPTS

After the summary and order index, include the individual receipts for every order included in the selected date.

For example:

Page 1:
Daily Summary

Page 2+:
Order Index

Remaining pages:
Receipt #001
Receipt #002
Receipt #003
...
Receipt #050

Each receipt should use the existing receipt/order information and should contain enough information to verify the transaction.

At minimum, use the existing data to show things such as:

- Store/business name
- Order number
- Date
- Time
- Items
- Quantity
- Unit price where available
- Item total
- Order total
- Payment method where available

Do not invent data that does not exist.

Reuse the existing receipt UI/data/business rules if one already exists in the codebase.

5. PDF GENERATION

Provide a "Download Today's Report" / "Download Sales Report" action in the merchant UI.

The generated PDF should contain:

1. Summary
2. Order Index
3. All individual receipts

For 50 orders, the conceptual structure is:

SUMMARY
↓
ORDER INDEX
↓
RECEIPT #001
↓
RECEIPT #002
↓
...
↓
RECEIPT #050

The PDF should be suitable for:

- Sending to the shop owner
- WhatsApp sharing
- Printing
- Keeping as a daily record

The PDF should be clean, lightweight and readable on both phone and desktop.

6. MERCHANT UI

Design the UI according to the existing FoodBaba merchant-side design system.

Do not create a complicated accounting dashboard.

The primary screen can be something like:

Sales Report

[ Today ▼ ]

50 Orders
₹5,840 Sales

[ View Report ]

[ Download PDF ]

Optionally provide:

[ Share PDF ]

The interface should remain extremely simple because the target merchant/worker may not be highly technical.

7. DATE FILTERING

The selected date must control everything in the report.

Example:

21 Aug 2026
→ fetch orders for 21 Aug 2026
→ calculate summary
→ generate index
→ include receipts

If the user selects:

20 Aug 2026

the entire report should represent only 20 Aug 2026.

Be careful about timezone/date boundaries. Use the store's configured timezone/current project convention rather than blindly using UTC if the existing codebase already has timezone handling.

8. ORDER STATUS / ELIGIBILITY

Inspect the existing order statuses and business rules before implementing.

Determine which orders should count toward sales based on the existing application logic.

Do not arbitrarily count cancelled/refunded/etc. orders as successful sales.

Reuse existing order status/payment logic wherever possible.

If the current codebase already has established logic for what constitutes a valid sale, use that.

9. PERFORMANCE

Do not make one database request per receipt.

For example, if there are 50 orders, do NOT execute 50 separate order queries.

Fetch the required order and order-item data efficiently, then generate the report from the retrieved dataset.

Reuse existing services/repositories/API endpoints where appropriate.

The report should remain practical for hundreds of orders.

10. ARCHITECTURE

Before implementing, inspect the current codebase and determine:

- Existing order architecture
- Existing order-item architecture
- Existing merchant pages
- Existing receipt implementation
- Existing PDF/file-generation approach
- Existing date filtering utilities
- Existing payment/order status logic
- Existing Supabase queries/services/repositories
- Existing UI components/design system

Follow the current project's architecture rather than introducing an unrelated architecture.

If the project follows feature-first/modular architecture, keep this feature within the appropriate sales/reporting module.

11. DO NOT CHANGE UNRELATED FEATURES

This feature should not break or unnecessarily modify:

- Customer ordering
- Merchant order management
- Existing receipt generation
- Product/catalog functionality
- Payment functionality
- Authentication
- Store configuration
- Existing APIs

Reuse existing functionality wherever possible.

12. IMPORTANT PRODUCT INTENT

Think of this feature as a "daily digital receipt bundle".

The receiving shop owner should be able to:

A. Open the first page and immediately know:
   - How many orders happened
   - How much money was sold
   - What products/items were sold and their total quantities
   - Payment totals

B. Look at the index if they want to verify individual orders.

C. Open the actual receipt if there is a dispute or doubt.

Therefore the report hierarchy should remain:

SUMMARY → INDEX → RECEIPTS

Do not turn this into a complicated accounting/ERP report.

IMPLEMENTATION APPROACH

First inspect the current codebase thoroughly.

Then create an implementation plan identifying:

1. Existing components/services that can be reused
2. Required backend/API/database changes, if any
3. Required merchant UI changes
4. PDF generation approach
5. Data aggregation approach
6. Date/time handling
7. Order eligibility/status handling
8. Performance considerations
9. Files that need to be created/modified

After producing the plan, implement the feature following the existing project's conventions.

Prioritize correctness, simplicity, maintainability, mobile-first merchant UX, and reuse of existing FoodBaba functionality.