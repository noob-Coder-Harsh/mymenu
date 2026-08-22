# FoodBaba

FoodBaba is a mobile-first QR menu and ordering product for India’s small food businesses—tea stalls, momo carts, juice shops, cafés, QSRs, and cloud kitchens. Customers scan a store QR (or open a shareable link like `/s/{slug}`), browse the menu on their phone, add items to a cart, and place an order with name, phone, and cash/UPI—no app download. Merchants run the kitchen side from `/merchant`: phone OTP login, onboarding a store, building a laminated-menu-style catalog (categories, items, optional size/portion prices), opening or closing the shop, accepting walk-in counter orders, advancing tickets through New → Preparing → Ready → Completed, marking payment, downloading receipts, generating store QR posters, and pulling dated sales reports. The public site is bilingual (English / Hindi) and aimed at owners who need few taps and familiar labels, not a complex POS.

Ideal usage today is a single-store loop: seed or create a store, print or share the QR, keep the store **Open** during service, take customer and counter orders, and work the live order board. Closed stores stay browsable but block add-to-cart and checkout. Live status polling keeps the customer order page in sync while the merchant updates tickets. The stack is a Next.js monolith with Supabase Postgres (and storage for logos/images) and Firebase phone OTP for merchant auth. A full map of the `src` tree is in [`PROJECT_TREE.txt`](PROJECT_TREE.txt).

## What’s in the app so far

| Area | What you get |
| --- | --- |
| **Landing** | Marketing home, demo preview, merchant start / login |
| **Customer** | Public menu, cart, checkout, live order status |
| **Merchant** | Home ops, menu board, categories/items, orders, counter, store settings, QR, reports, account |
| **APIs** | Auth session, catalog CRUD, orders, profile, sales report, logo/QR assets, health check |

## Setup

1. Copy env and fill values from Supabase and Firebase:

```bash
cp .env.example .env.local
```

For Firebase Admin, download a service account JSON from Firebase Console → Project settings → Service accounts → Generate new private key. Save it as `firebase-service-account.json` in the repo root (gitignored) and set:

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

2. In the Supabase SQL editor, run [`schema.sql`](schema.sql).

3. Seed the demo store (`brew-cafe`):

```bash
npm run seed
```

Or paste [`seed.sql`](seed.sql) into the SQL editor.

4. Start the app:

```bash
npm run dev
```

## Smoke

- http://localhost:3000 — landing
- http://localhost:3000/api/health — DB ping (`ok: true` after schema + env)
- http://localhost:3000/merchant/login — phone OTP
- After OTP, new merchants go to `/merchant/onboarding`, then dashboard with Open/Closed
- `/merchant/menu` — categories, items, availability toggle
- Customer loop: open the store (`Open` on the dashboard), then `/s/brew-cafe` or **View customer menu**
  - Add 2 items → cart → checkout (name, phone, Cash/UPI) → confirmation with order number
  - Closed store: menu is browsable, Add and checkout are blocked
- `/merchant/orders` — New / Preparing / Ready / Completed, tap to accept → prepare → ready → complete
- Dashboard shows today orders, sales, new-order count, and recent tickets
- Customer `/s/{slug}/orders/{orderId}` polls every few seconds so the stepper updates live
- Mark payment paid/unpaid on the order detail screen
- `/merchant/counter` — walk-in orders from the same menu
- `/merchant/store` — link, open/closed, edit profile, QR poster
- `/merchant/reports` — date-ranged sales export

Enable **Phone** in Firebase Authentication, add `localhost` to authorized domains, and (for production SMS) enable billing. Allow **India (IN)** under Authentication → Settings → SMS region policy.

## Project tree

See [`PROJECT_TREE.txt`](PROJECT_TREE.txt) for the generated `src/` layout (`app`, `components`, `lib`, APIs). Regenerate anytime:

```bash
tree -a -I 'node_modules|.next' --dirsfirst -F src > PROJECT_TREE.txt
```
