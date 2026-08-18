import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";
import type { Database } from "@/lib/types/database";

let anonClient: SupabaseClient<Database> | null = null;

export function getSupabaseAnon(): SupabaseClient<Database> {
  if (anonClient) {
    return anonClient;
  }

  anonClient = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  return anonClient;
}
