# FoodBaba

QR menu and ordering for cafes, carts, and small food businesses.

Next.js monolith, Supabase Postgres, Firebase phone OTP for merchants.

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
- http://localhost:3000/s/brew-cafe — customer shell

Enable **Phone** in Firebase Authentication, add `localhost` to authorized domains, and (for production SMS) enable billing.
