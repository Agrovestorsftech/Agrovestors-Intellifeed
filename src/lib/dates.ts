const fmt = (d: Date, withYear = true) =>
  d.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });

/** Today, e.g. "Nov 14, 2026". */
export function todayLabel(): string {
  return fmt(new Date());
}

/** Range ending today, e.g. "Oct 25 – Nov 14, 2026". */
export function recentRangeLabel(days = 21): string {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  return `${fmt(start, false)} – ${fmt(end)}`;
}

/** First name from a display name, e.g. "Jane Doe" → "Jane". */
export function firstName(name: string | undefined | null): string {
  return name?.trim().split(/\s+/)[0] || "there";
}
