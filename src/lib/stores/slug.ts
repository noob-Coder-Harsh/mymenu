export function slugify(name: string) {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return slug || "store";
}

export function uniqueSlugCandidate(base: string) {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base.slice(0, 35)}-${suffix}`;
}
