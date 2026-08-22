import { getMerchantContext, upsertMerchantFromFirebase } from "@/lib/auth/merchant";
import {
  clearSessionCookie,
  createSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import { verifyFirebaseIdToken } from "@/lib/auth/verify-id-token";
import { jsonError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Store } from "@/lib/types/database";

async function getOwnedStore(userId: string): Promise<Store | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function GET() {
  try {
    const context = await getMerchantContext();
    if (!context) {
      if (await readSessionCookie()) {
        await clearSessionCookie();
      }
      return jsonError("Unauthorized", 401);
    }

    return Response.json({
      user: context.user,
      store: context.store,
      needsOnboarding: !context.store,
    });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Session check failed";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    let idToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : "";

    if (!idToken) {
      try {
        const body = (await request.json()) as { idToken?: string };
        idToken = body.idToken?.trim() ?? "";
      } catch {
        idToken = "";
      }
    }

    if (!idToken) {
      return jsonError("Missing ID token", 400);
    }

    const verified = await verifyFirebaseIdToken(`Bearer ${idToken}`);
    if (!verified.ok) {
      return jsonError(verified.error || "Invalid or expired ID token", 401);
    }

    const decoded = verified.decoded;
    const phone = decoded.phone_number;
    if (!phone) {
      return jsonError("Phone number is required", 400);
    }

    const user = await upsertMerchantFromFirebase({
      firebaseUid: decoded.uid,
      phone,
      name: typeof decoded.name === "string" ? decoded.name : null,
    });
    const sessionCookie = await createSessionCookie(idToken);
    await setSessionCookie(sessionCookie);
    const store = await getOwnedStore(user.id);

    return Response.json({
      user,
      store,
      needsOnboarding: !store,
    });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Could not create session";
    return jsonError(message, 500);
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return new Response(null, { status: 204 });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Could not clear session";
    return jsonError(message, 500);
  }
}
