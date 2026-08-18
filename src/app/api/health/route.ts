import { getEnvStatus } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const env = getEnvStatus();

  if (!env.supabaseAdmin) {
    return Response.json(
      {
        ok: false,
        product: "foodbaba",
        milestone: "I0",
        db: "skipped",
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
          env,
        },
        { status: 503 },
      );
    }

    return Response.json({
      ok: true,
      product: "foodbaba",
      milestone: "I0",
      db: "ok",
      env: {
        supabaseAdmin: env.supabaseAdmin,
        supabaseAnon: env.supabaseAnon,
        firebaseAdmin: env.firebaseAdmin,
        firebaseClient: env.firebaseClient,
        missing: env.missing,
      },
    });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Unexpected database error";

    return Response.json(
      {
        ok: false,
        product: "foodbaba",
        milestone: "I0",
        db: message,
        env,
      },
      { status: 503 },
    );
  }
}
