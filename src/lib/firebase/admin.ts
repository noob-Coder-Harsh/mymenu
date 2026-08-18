import "server-only";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
};

function toServiceAccount(raw: ServiceAccountJson): ServiceAccount {
  const projectId = raw.projectId ?? raw.project_id;
  const clientEmail = raw.clientEmail ?? raw.client_email;
  const privateKey = raw.privateKey ?? raw.private_key;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase service account JSON is missing project_id, client_email, or private_key");
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function loadServiceAccount(): ServiceAccount {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const trimmed = json.trim().replace(/^['"]/, "").replace(/['"]$/, "");
    return toServiceAccount(JSON.parse(trimmed) as ServiceAccountJson);
  }

  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (filePath) {
    const absolutePath = resolve(process.cwd(), filePath);
    const parsed = JSON.parse(readFileSync(absolutePath, "utf8")) as ServiceAccountJson;
    return toServiceAccount(parsed);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return toServiceAccount({ projectId, clientEmail, privateKey });
  }

  throw new Error(
    "Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_PATH (JSON file) or FIREBASE_SERVICE_ACCOUNT_JSON.",
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
  return getAuth(getAdminApp());
}
