import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, CalendarCheck2, MapPin } from "lucide-react";
import { useScheduleRange } from "@/hooks/useDashboard";
import { localDayKey } from "@/lib/dashboard/queries";
import { ScheduleStatusPill } from "@/components/dashboard/TodaysSchedule";

function startOfWeek(offsetWeeks: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offsetWeeks * 7); // Monday
  return d;
}

/** Week strip (Mon–Sun) + the selected day's planned visits. */
export function WeekSchedule({ action }: { action?: ReactNode }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const from = useMemo(() => startOfWeek(weekOffset), [weekOffset]);
  const to = useMemo(() => {
    const d = new Date(from);
    d.setDate(d.getDate() + 7);
    return d;
  }, [from]);
  const todayKey = localDayKey(new Date());
  const [selected, setSelected] = useState<string>(todayKey);
  const { data, isLoading, error, refetch } = useScheduleRange(from, to);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    return d;
  });
  const byDay = new Map<string, NonNullable<typeof data>>();
  for (const v of data ?? []) {
    const k = localDayKey(v.at);
    byDay.set(k, [...(byDay.get(k) ?? []), v]);
  }
  // Keep a valid selection when paging weeks.
  const selectedKey = days.some((d) => localDayKey(d) === selected) ? selected : localDayKey(days[0]!);
  const items = byDay.get(selectedKey) ?? [];
  const rangeLabel = `${from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6]!.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  const navBtn =
    "grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <section id="schedule" className="scroll-mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Visit schedule</h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">{rangeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {action}
          <button type="button" className={navBtn} onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setWeekOffset(0);
              setSelected(todayKey);
            }}
            disabled={weekOffset === 0 && selectedKey === todayKey}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Today
          </button>
          <button type="button" className={navBtn} onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2" role="tablist" aria-label="Days of the week">
        {days.map((d) => {
          const k = localDayKey(d);
          const count = byDay.get(k)?.length ?? 0;
          const active = k === selectedKey;
          const isToday = k === todayKey;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}, ${count} visit${count === 1 ? "" : "s"}`}
              onClick={() => setSelected(k)}
              className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
              }`}
            >
              <span className={`text-[11px] font-medium uppercase ${active ? "" : "text-muted-foreground"}`}>
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span className={`text-base font-semibold tabular-nums ${isToday && !active ? "text-primary" : ""}`}>{d.getDate()}</span>
              <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                {Array.from({ length: Math.min(count, 4) }, (_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${active ? "bg-primary-foreground" : "bg-primary"}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5" role="tabpanel">
        {error ? (
          <p className="py-6 text-center text-sm text-destructive">
            Couldn't load the schedule.{" "}
            <button type="button" onClick={() => refetch()} className="font-medium text-primary hover:underline">
              Try again
            </button>
          </p>
        ) : isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted motion-safe:animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarCheck2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-foreground">No visits planned</p>
            <p className="text-xs text-muted-foreground">Pick another day or log a visit.</p>
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {items.map((v) => (
              <li key={v.id} className="flex items-center gap-4 py-3">
                <span className="w-[68px] shrink-0 text-sm font-medium tabular-nums text-muted-foreground">{v.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{v.farm}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {v.region} · {v.purpose}
                  </p>
                </div>
                <ScheduleStatusPill status={v.status} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
