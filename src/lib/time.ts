export const INDIA_TIME_ZONE = "Asia/Kolkata";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayDateKeyInIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isValidDateKey(value: string) {
  if (!DATE_KEY_RE.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/** Shift a YYYY-MM-DD calendar date by `deltaDays` (calendar arithmetic, not TZ). */
export function shiftDateKey(dateKey: string, deltaDays: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const y = probe.getUTCFullYear();
  const m = String(probe.getUTCMonth() + 1).padStart(2, "0");
  const d = String(probe.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfDayIsoInIndia(dateKey: string) {
  if (!isValidDateKey(dateKey)) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  return `${dateKey}T00:00:00+05:30`;
}

export function startOfTodayIsoInIndia() {
  return startOfDayIsoInIndia(todayDateKeyInIndia());
}

export function formatTimeIst(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDayTimeIst(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateIst(dateKeyOrIso: string) {
  const iso = DATE_KEY_RE.test(dateKeyOrIso)
    ? startOfDayIsoInIndia(dateKeyOrIso)
    : dateKeyOrIso;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatReceiptDateTimeIst(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
