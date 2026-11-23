import { useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Calendar as CalendarIcon, ChevronRight, CalendarX2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCalendarEvents } from "@/hooks/useDashboard";
import { localDayKey, type CalendarEvent } from "@/lib/dashboard/queries";
import { todayLabel } from "@/lib/dates";

const TONE_DOT: Record<CalendarEvent["tone"], string> = {
  primary: "bg-primary",
  info: "bg-info",
  warning: "bg-warning",
  destructive: "bg-destructive",
  success: "bg-success",
};

/**
 * Header date button → month calendar of the user's activity (visits, cases,
 * orders… depending on role). Days with events get a dot; picking a day lists
 * its events, each linking to the screen it belongs to.
 */
export function HeaderCalendar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [month, setMonth] = useState<Date>(() => new Date());

  // Fetch the visible month plus outside days.
  const { from, to } = useMemo(() => {
    const f = new Date(month.getFullYear(), month.getMonth(), 1);
    f.setDate(f.getDate() - 7);
    const t = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    t.setDate(t.getDate() + 7);
    return { from: f, to: t };
  }, [month]);
  const { data, isLoading, isError } = useCalendarEvents(from, to);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of data ?? []) {
      const k = localDayKey(e.at);
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return m;
  }, [data]);
  const eventDays = useMemo(() => [...byDay.keys()].map((k) => new Date(`${k}T12:00:00`)), [byDay]);
  const dayEvents = byDay.get(localDayKey(selected)) ?? [];

  const go = (href: string) => {
    setOpen(false);
    router.navigate({ href });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open activity calendar"
          className={`inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted ${className}`}
        >
          <span suppressHydrationWarning>{todayLabel()}</span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] overflow-hidden rounded-2xl p-0">
        <Calendar
          mode="single"
          required
          selected={selected}
          onSelect={(d) => d && setSelected(d)}
          month={month}
          onMonthChange={setMonth}
          modifiers={{ hasEvents: eventDays }}
          modifiersClassNames={{
            hasEvents:
              "relative after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
          }}
          className="mx-auto"
        />
        <div className="border-t border-border">
          <div className="flex items-center justify-between px-4 pt-3">
            <p className="text-xs font-semibold text-foreground">
              {selected.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </p>
            {localDayKey(selected) !== localDayKey(new Date()) && (
              <button
                type="button"
                onClick={() => {
                  setSelected(new Date());
                  setMonth(new Date());
                }}
                className="rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Today
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto px-2 pb-2 pt-1">
            {isError ? (
              <p className="px-2 py-4 text-center text-xs text-destructive">Couldn't load activity.</p>
            ) : isLoading ? (
              <div className="space-y-2 p-2" aria-busy="true">
                <div className="h-10 rounded-lg bg-muted motion-safe:animate-pulse" />
                <div className="h-10 rounded-lg bg-muted motion-safe:animate-pulse" />
              </div>
            ) : dayEvents.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-2 py-5 text-center">
                <CalendarX2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">Nothing on this day.</p>
              </div>
            ) : (
              <ul>
                {dayEvents.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => go(e.href)}
                      className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[e.tone]}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{e.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{e.subtitle}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
