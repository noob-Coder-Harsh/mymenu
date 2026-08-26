import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { slugify, uniqueSlugCandidate } from "@/lib/stores/slug";

function escapeIlike(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function allocateSlug(baseName: string, excludeStoreId?: string) {
  const supabase = getSupabaseAdmin();
  let candidate = slugify(baseName);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    let query = supabase.from("stores").select("id").eq("slug", candidate);
    if (excludeStoreId) {
      query = query.neq("id", excludeStoreId);
    }
    const { data } = await query.maybeSingle();

    if (!data) {
      return candidate;
    }

    candidate = uniqueSlugCandidate(slugify(baseName));
  }

  return uniqueSlugCandidate(slugify(baseName));
}

/** Case-insensitive name match, or another store already owns the base slug. */
export async function isStoreNameTaken(name: string, excludeStoreId?: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return false;
  }

  const supabase = getSupabaseAdmin();
  const slug = slugify(trimmed);

  let byName = supabase
    .from("stores")
    .select("id")
    .ilike("name", escapeIlike(trimmed))
    .limit(1);
  if (excludeStoreId) {
    byName = byName.neq("id", excludeStoreId);
  }
  const { data: nameMatch } = await byName.maybeSingle();
  if (nameMatch) {
    return true;
  }

  let bySlug = supabase.from("stores").select("id").eq("slug", slug).limit(1);
  if (excludeStoreId) {
    bySlug = bySlug.neq("id", excludeStoreId);
  }
  const { data: slugMatch } = await bySlug.maybeSingle();
  return Boolean(slugMatch);
}
