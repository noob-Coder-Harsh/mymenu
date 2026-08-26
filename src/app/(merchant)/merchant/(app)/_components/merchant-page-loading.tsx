export function MerchantPageLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-4 w-28 animate-pulse rounded-full bg-border/80" />
      <div className="h-10 w-full animate-pulse rounded-2xl bg-border/70" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-border/60" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-border/50" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-border/40" />
    </div>
  );
}
