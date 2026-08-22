import "server-only";

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export async function verifyFirebaseIdToken(
  authorizationHeader: string | null,
) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }

  try {
    const auth = await getFirebaseAdminAuth();
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
}
