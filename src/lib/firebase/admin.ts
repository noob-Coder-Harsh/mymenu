import "server-only";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
};

let adminAuth: Auth | null = null;
let adminMessaging: Messaging | null = null;

function stripWrappingQuotes(value: string) {
  let trimmed = value.trim();
  // Vercel/UI sometimes wraps the whole value in quotes more than once.
  for (let i = 0; i < 2; i += 1) {
    if (
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      trimmed = trimmed.slice(1, -1).trim();
      continue;
    }
    break;
  }
  return trimmed;
}

/**
 * Vercel env values arrive in many shapes: real newlines, `\n`, `\\n`,
 * quoted PEM, or a single line with spaces. Normalize to a PEM private key.
 */
function normalizePrivateKey(input: string): string {
  let key = stripWrappingQuotes(input);
  key = key.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Unescape repeatedly (handles \n and \\n from different env UIs).
  for (let i = 0; i < 4; i += 1) {
    if (!key.includes("\\n")) {
      break;
    }
    key = key.replace(/\\n/g, "\n");
  }

  // Some pastes turn PEM newlines into spaces.
  if (key.includes("-----BEGIN") && !key.includes("\n")) {
    key = key
      .replace(/-----BEGIN ([^-]+)----- +/, "-----BEGIN $1-----\n")
      .replace(/ +-----END ([^-]+)-----/, "\n-----END $1-----");
  }

  if (key.includes("-----END") && !key.endsWith("\n")) {
    key += "\n";
  }

  return key;
}

function toServiceAccount(raw: ServiceAccountJson): ServiceAccount {
  const projectId = raw.projectId ?? raw.project_id;
  const clientEmail = raw.clientEmail ?? raw.client_email;
  const privateKeyRaw = raw.privateKey ?? raw.private_key;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Firebase service account is missing project_id, client_email, or private_key",
    );
  }

  const privateKey = normalizePrivateKey(privateKeyRaw);
  if (!privateKey.includes("BEGIN") || !privateKey.includes("PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY does not look like a PEM private key. Paste the private_key value from the service-account JSON.",
    );
  }

  // Validate early so we can try the next credential source.
  cert({ projectId, clientEmail, privateKey });

  return { projectId, clientEmail, privateKey };
}

function parseServiceAccountJson(raw: string): ServiceAccountJson {
  const trimmed = stripWrappingQuotes(raw);

  try {
    return JSON.parse(trimmed) as ServiceAccountJson;
  } catch (firstError) {
    const collapsed = trimmed.replace(/\r?\n/g, " ").replace(/\s+/g, " ");
    try {
      return JSON.parse(collapsed) as ServiceAccountJson;
    } catch {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON (${
          firstError instanceof Error ? firstError.message : "parse error"
        }). Prefer FIREBASE_SERVICE_ACCOUNT_BASE64 on Vercel.`,
      );
    }
  }
}

function loadFromSplitEnv(): ServiceAccount {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Split Firebase Admin env vars incomplete");
  }
  return toServiceAccount({ projectId, clientEmail, privateKey });
}

function loadFromBase64(): ServiceAccount {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (!base64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not set");
  }
  return toServiceAccount(
    parseServiceAccountJson(Buffer.from(base64, "base64").toString("utf8")),
  );
}

function loadFromJsonEnv(): ServiceAccount {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not set");
  }
  return toServiceAccount(parseServiceAccountJson(json));
}

function loadFromFile(): ServiceAccount {
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!filePath) {
    throw new Error("No Firebase service-account file path set");
  }
  const absolutePath = resolve(process.cwd(), filePath);
  const parsed = JSON.parse(
    readFileSync(absolutePath, "utf8"),
  ) as ServiceAccountJson;
  return toServiceAccount(parsed);
}

function loadServiceAccount(): ServiceAccount {
  // Base64 first — most reliable on Vercel (avoids mangled private_key newlines).
  const loaders: Array<[string, () => ServiceAccount]> = [
    ["FIREBASE_SERVICE_ACCOUNT_BASE64", loadFromBase64],
    ["FIREBASE_SERVICE_ACCOUNT_JSON", loadFromJsonEnv],
    ["FIREBASE_PRIVATE_KEY", loadFromSplitEnv],
    ["service-account file", loadFromFile],
  ];

  const errors: string[] = [];
  for (const [label, load] of loaders) {
    try {
      return load();
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "unknown error";
      // Skip "not set" noise; keep real parse failures for the final message.
      if (!/not set|incomplete|No Firebase/i.test(message)) {
        errors.push(`${label}: ${message}`);
      }
    }
  }

  throw new Error(
    errors.length > 0
      ? `Firebase Admin credentials invalid. ${errors.join(" | ")}`
      : "Firebase Admin credentials missing. On Vercel set FIREBASE_SERVICE_ACCOUNT_BASE64 (recommended) or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.",
  );
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const serviceAccount = loadServiceAccount();
  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

export function getFirebaseAdminAuth(): Auth {
  if (adminAuth) {
    return adminAuth;
  }
  adminAuth = getAuth(getAdminApp());
  return adminAuth;
}

export function getFirebaseAdminMessaging(): Messaging {
  if (adminMessaging) {
    return adminMessaging;
  }
  adminMessaging = getMessaging(getAdminApp());
  return adminMessaging;
}

export function probeFirebaseAdmin():
  | { ok: true; projectId: string | null }
  | { ok: false; error: string } {
  try {
    const auth = getFirebaseAdminAuth();
    return { ok: true, projectId: auth.app.options.projectId ?? null };
  } catch (reason) {
    return {
      ok: false,
      error:
        reason instanceof Error ? reason.message : "Firebase Admin init failed",
    };
  }
}
