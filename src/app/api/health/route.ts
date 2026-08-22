import { getEnvStatus } from "@/lib/env";
import { probeFirebaseAdmin } from "@/lib/firebase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const env = getEnvStatus();
  const firebase = await probeFirebaseAdmin();

  if (!env.supabaseAdmin) {
    return Response.json(
      {
        ok: false,
        product: "foodbaba",
        milestone: "I0",
        db: "skipped",
        firebase,
        env,
      },
      { status: 503 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("stores").select("id").limit(1);

    if (error) {
      return Response.json(
        {
          ok: false,
          product: "foodbaba",
          milestone: "I0",
          db: error.message,
          firebase,
          env,
        },
        { status: 503 },
      );
    }

    const ok = firebase.ok;

    return Response.json(
      {
        ok,
        product: "foodbaba",
        milestone: "I0",
        db: "ok",
        firebase,
        env: {
          supabaseAdmin: env.supabaseAdmin,
          supabaseAnon: env.supabaseAnon,
          firebaseAdmin: env.firebaseAdmin,
          firebaseClient: env.firebaseClient,
          missing: env.missing,
        },
      },
      { status: ok ? 200 : 503 },
    );
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Unexpected database error";

    return Response.json(
      {
        ok: false,
        product: "foodbaba",
        milestone: "I0",
        db: message,
        firebase,
        env,
      },
      { status: 503 },
    );
  }
}
