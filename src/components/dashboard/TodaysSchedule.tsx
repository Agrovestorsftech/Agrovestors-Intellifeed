import { CheckCircle2, Clock, CalendarClock } from "lucide-react";
import { useTodaysSchedule } from "@/hooks/useDashboard";

type Status = "Completed" | "Pending" | "Upcoming";

const statusMeta: Record<Status, { label: string; className: string; Icon: typeof Clock }> = {
  Completed: {
    label: "Completed",
    className: "bg-success-soft text-success",
    Icon: CheckCircle2,
  },
  Pending: {
    label: "Pending",
    className: "bg-warning-soft text-warning-foreground",
    Icon: Clock,
  },
  Upcoming: {
    label: "Upcoming",
    className: "bg-info-soft text-info",
    Icon: CalendarClock,
  },
};

export function TodaysSchedule() {
  const { data, isLoading, error } = useTodaysSchedule();
  const visits = data ?? [];
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Today's Schedule</h2>
      {error ? (
        <p className="text-sm text-destructive">Couldn't load schedule.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : visits.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center flex-1 grid place-items-center">No visits scheduled.</p>
      ) : (
      <ol className="flex-1 space-y-5">
        {visits.map((v) => {
          const meta = statusMeta[v.status as Status];
          return (
            <li key={v.id} className="flex items-center gap-4">
              <div className="w-[70px] shrink-0 text-sm font-medium text-muted-foreground">{v.time}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{v.farm}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{v.category}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${meta.className}`}
              >
                {meta.label}
              </span>
            </li>
          );
        })}
      </ol>
      )}

      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View Full Schedule
      </button>
    </section>
  );
}
