import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck2, CalendarClock, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTodaysSchedule } from "@/hooks/useDashboard";
import type { ScheduleItem } from "@/lib/dashboard/queries";

export const scheduleStatusMeta: Record<ScheduleItem["status"], { className: string; Icon: typeof Clock }> = {
  Completed: { className: "bg-success-soft text-success", Icon: CheckCircle2 },
  Due: { className: "bg-warning-soft text-warning-foreground", Icon: Clock },
  Upcoming: { className: "bg-info-soft text-info", Icon: CalendarClock },
  Missed: { className: "bg-destructive-soft text-destructive", Icon: XCircle },
};

export function ScheduleStatusPill({ status }: { status: ScheduleItem["status"] }) {
  const { className, Icon } = scheduleStatusMeta[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}

export function TodaysSchedule() {
  const { data, isLoading, error, refetch } = useTodaysSchedule();
  const visits = data ?? [];
  const done = visits.filter((v) => v.status === "Completed").length;

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Today's Schedule</h2>
        {visits.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {done} of {visits.length} done
          </span>
        )}
      </div>

      {error ? (
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <p className="text-sm text-destructive">Couldn't load your schedule.</p>
            <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-medium text-primary hover:underline">
              Try again
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <ul className="flex-1 space-y-5" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-4">
              <span className="h-4 w-14 rounded bg-muted motion-safe:animate-pulse" />
              <span className="h-9 flex-1 rounded-lg bg-muted motion-safe:animate-pulse" />
            </li>
          ))}
        </ul>
      ) : visits.length === 0 ? (
        <div className="grid flex-1 place-items-center py-6 text-center">
          <div>
            <CalendarCheck2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-foreground">No visits planned today</p>
            <p className="text-xs text-muted-foreground">Check the full schedule for the rest of the week.</p>
          </div>
        </div>
      ) : (
        <ol className="flex-1 space-y-4">
          {visits.map((v) => (
            <li key={v.id} className="flex items-center gap-4">
              <div className="w-[68px] shrink-0 text-sm font-medium tabular-nums text-muted-foreground">{v.time}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{v.farm}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{v.purpose}</p>
              </div>
              <ScheduleStatusPill status={v.status} />
            </li>
          ))}
        </ol>
      )}

      <Link
        to="/my-visits"
        hash="schedule"
        className="group mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        View Full Schedule
        <ArrowRight className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
