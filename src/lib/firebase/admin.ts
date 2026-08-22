import "server-only";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { App, ServiceAccount } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
};

let adminAuth: Auth | null = null;

function toServiceAccount(raw: ServiceAccountJson): ServiceAccount {
  const projectId = raw.projectId ?? raw.project_id;
  const clientEmail = raw.clientEmail ?? raw.client_email;
  const privateKey = raw.privateKey ?? raw.private_key;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase service account is missing project_id, client_email, or private_key",
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
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
        }). On Vercel use FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, or paste JSON as one line.`,
      );
    }
  }
}

function loadServiceAccount(): ServiceAccount {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    return toServiceAccount({
      projectId,
      clientEmail,
      privateKey: stripWrappingQuotes(privateKey),
    });
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (base64) {
    return toServiceAccount(
      parseServiceAccountJson(Buffer.from(base64, "base64").toString("utf8")),
    );
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    return toServiceAccount(parseServiceAccountJson(json));
  }

  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (filePath) {
    const absolutePath = resolve(process.cwd(), filePath);
    const parsed = JSON.parse(
      readFileSync(absolutePath, "utf8"),
    ) as ServiceAccountJson;
    return toServiceAccount(parsed);
  }

  throw new Error(
    "Firebase Admin credentials missing. On Vercel set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
  );
}

async function getAdminApp(): Promise<App> {
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
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

export async function getFirebaseAdminAuth(): Promise<Auth> {
  if (adminAuth) {
    return adminAuth;
  }

  const { getAuth } = await import("firebase-admin/auth");
  adminAuth = getAuth(await getAdminApp());
  return adminAuth;
}

export async function probeFirebaseAdmin(): Promise<
  { ok: true; projectId: string | null } | { ok: false; error: string }
> {
  try {
    const auth = await getFirebaseAdminAuth();
    return { ok: true, projectId: auth.app.options.projectId ?? null };
  } catch (reason) {
    return {
      ok: false,
      error:
        reason instanceof Error ? reason.message : "Firebase Admin init failed",
    };
  }
}
