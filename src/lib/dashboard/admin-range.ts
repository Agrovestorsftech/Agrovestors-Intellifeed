import { useSyncExternalStore } from "react";

/** Admin dashboard reporting window (days), shared by the header picker and charts. */
export const RANGE_OPTIONS = [7, 14, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];

let current: RangeDays = 7;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setAdminRange(days: RangeDays) {
  current = days;
  listeners.forEach((fn) => fn());
}

export function useAdminRange(): [RangeDays, (d: RangeDays) => void] {
  const days = useSyncExternalStore(subscribe, () => current, () => 7 as RangeDays);
  return [days, setAdminRange];
}

export function rangeLabel(days: number): string {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  const f = (d: Date, year: boolean) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}) });
  return `${f(start, false)} – ${f(end, true)}`;
}
