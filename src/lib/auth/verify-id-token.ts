import "server-only";

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export async function verifyFirebaseIdToken(
  authorizationHeader: string | null,
) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return { ok: false as const, error: "Missing bearer token" };
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false as const, error: "Missing ID token" };
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    return { ok: true as const, decoded };
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Token verification failed";
    return { ok: false as const, error: message };
  }
}
