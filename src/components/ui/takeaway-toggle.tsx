"use client";

export function TakeawayToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-base font-semibold transition-colors ${
        value
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-muted"
      }`}
    >
      {value ? (
        <>
          <span aria-hidden>✓</span>
          Takeaway
        </>
      ) : (
        "Takeaway"
      )}
    </button>
  );
}
