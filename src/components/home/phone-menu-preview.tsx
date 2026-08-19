export function PhoneMenuPreview({
  size = "sm",
}: {
  size?: "sm" | "lg";
}) {
  const compact = size === "sm";

  return (
    <div
      className={`mx-auto w-full ${compact ? "max-w-[220px]" : "max-w-[280px]"}`}
      aria-hidden
    >
      <div className="rounded-[2.1rem] border-[6px] border-[#2c1810] bg-[#2c1810] shadow-[0_24px_50px_-20px_rgba(44,24,16,0.55)]">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-background">
          <div className="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-[#2c1810]" />
          <div className="flex items-center justify-between px-4 pb-1 pt-6 text-[10px] text-muted">
            <span>9:41</span>
            <span>FoodBaba</span>
          </div>
          <div className={`px-3 pb-3 ${compact ? "pt-1" : "pt-2"}`}>
            <div className="flex items-center gap-2 rounded-2xl bg-surface px-2.5 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-lg">
                ☕
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">
                  Ramesh Tea
                </p>
                <p className="text-[11px] font-medium text-success">Open</p>
              </div>
            </div>

            <p className="mt-3 px-0.5 text-[10px] font-semibold tracking-wide text-muted">
              CHAI
            </p>
            <MenuRow name="Masala Chai" price="₹20" compact={compact} />
            <MenuRow name="Cold Coffee" price="₹80" compact={compact} />

            <p className="mt-3 px-0.5 text-[10px] font-semibold tracking-wide text-muted">
              MOMOS · FRIES
            </p>
            <MenuRow name="Veg Momos" price="₹70" compact={compact} emoji="🥟" />
            <MenuRow name="French Fries" price="₹60" compact={compact} emoji="🍟" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuRow({
  name,
  price,
  compact,
  emoji,
}: {
  name: string;
  price: string;
  compact: boolean;
  emoji?: string;
}) {
  return (
    <div
      className={`mt-1.5 flex items-center justify-between rounded-xl bg-surface px-2.5 ${
        compact ? "py-1.5" : "py-2"
      }`}
    >
      <span className="flex items-center gap-1.5 text-[12px] font-medium">
        {emoji ? <span>{emoji}</span> : null}
        {name}
      </span>
      <span className="text-[12px] font-semibold">{price}</span>
    </div>
  );
}
