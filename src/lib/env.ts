const PUBLIC_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const SERVER_KEYS = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

function hasFirebaseAdmin(): boolean {
  return Boolean(
    (process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

export type EnvStatus = {
  supabaseAdmin: boolean;
  supabaseAnon: boolean;
  firebaseAdmin: boolean;
  firebaseClient: boolean;
  missing: string[];
};

export function getEnvStatus(): EnvStatus {
  const missing: string[] = [...PUBLIC_KEYS, ...SERVER_KEYS].filter(
    (key) => !process.env[key],
  );

  if (!hasFirebaseAdmin()) {
    missing.push("FIREBASE_PRIVATE_KEY");
  }

  return {
    supabaseAdmin: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    supabaseAnon: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    firebaseAdmin: hasFirebaseAdmin(),
    firebaseClient: PUBLIC_KEYS.every((key) => Boolean(process.env[key])),
    missing,
  };
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}
