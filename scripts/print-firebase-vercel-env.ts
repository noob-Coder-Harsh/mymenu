/**
 * Print Vercel-safe Firebase Admin env values from a local service-account JSON.
 *
 * Usage:
 *   npx tsx scripts/print-firebase-vercel-env.ts ./im7ms-b598d-firebase-adminsdk-fbsvc-99cf6c629f.json
 *
 * Then paste FIREBASE_SERVICE_ACCOUNT_BASE64 into Vercel (recommended).
 * Remove broken FIREBASE_PRIVATE_KEY / multiline FIREBASE_SERVICE_ACCOUNT_JSON if present.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = process.argv[2];
if (!file) {
  console.error(
    "Usage: npx tsx scripts/print-firebase-vercel-env.ts <service-account.json>",
  );
  process.exit(1);
}

const absolute = resolve(process.cwd(), file);
const raw = readFileSync(absolute, "utf8");
const parsed = JSON.parse(raw) as {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
  console.error("JSON missing project_id, client_email, or private_key");
  process.exit(1);
}

const base64 = Buffer.from(raw).toString("base64");
const privateKeyForEnv = parsed.private_key.replace(/\n/g, "\\n");

console.log("# Recommended on Vercel (single value, no newline issues):");
console.log(`FIREBASE_SERVICE_ACCOUNT_BASE64=${base64}`);
console.log("");
console.log("# Optional alternative (three vars):");
console.log(`FIREBASE_PROJECT_ID=${parsed.project_id}`);
console.log(`FIREBASE_CLIENT_EMAIL=${parsed.client_email}`);
console.log(`FIREBASE_PRIVATE_KEY="${privateKeyForEnv}"`);
console.log("");
console.log(
  "# After setting BASE64, delete FIREBASE_PRIVATE_KEY and multiline FIREBASE_SERVICE_ACCOUNT_JSON from Vercel.",
);
