import { ArrowRight, CheckCircle2, Clock, CalendarClock } from "lucide-react";

type Status = "Completed" | "Pending" | "Upcoming";

type Visit = {
  time: string;
  farm: string;
  category: string;
  status: Status;
};

const visits: Visit[] = [
  { time: "09:00 AM", farm: "Green Valley Farm", category: "Broilers", status: "Completed" },
  { time: "10:30 AM", farm: "Sunnyvale Farm", category: "Layers", status: "Completed" },
  { time: "12:00 PM", farm: "Ade's Farm", category: "Broilers", status: "Pending" },
  { time: "02:00 PM", farm: "Hilltop Farm", category: "Pigs", status: "Pending" },
  { time: "04:00 PM", farm: "Riverbend Farm", category: "Catfish", status: "Upcoming" },
];

const statusMeta: Record<Status, { label: string; className: string; Icon: typeof Clock; dot: string }> = {
  Completed: {
    label: "Completed",
    className: "bg-success-soft text-success",
    Icon: CheckCircle2,
    dot: "bg-success",
  },
  Pending: {
    label: "Pending",
    className: "bg-warning-soft text-warning-foreground",
    Icon: Clock,
    dot: "bg-warning",
  },
  Upcoming: {
    label: "Upcoming",
    className: "bg-info-soft text-info",
    Icon: CalendarClock,
    dot: "bg-info",
  },
};

export function TodaysSchedule() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Today's Schedule</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Farm visits assigned for today</p>
        </div>
        <span className="text-xs text-muted-foreground">{visits.length} visits</span>
      </div>

      <ol className="relative space-y-4">
        <span
          aria-hidden
          className="absolute left-[15px] top-2 bottom-2 w-px bg-border"
        />
        {visits.map((v) => {
          const meta = statusMeta[v.status];
          const StatusIcon = meta.Icon;
          return (
            <li key={v.time} className="relative flex items-center gap-4 pl-9">
              <span
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ${meta.dot} ring-4 ring-card`}
              />
              <div className="w-20 shrink-0 text-sm font-medium text-muted-foreground">{v.time}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{v.farm}</p>
                <p className="text-xs text-muted-foreground">{v.category}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
            </li>
          );
        })}
      </ol>

      <button className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all">
        View Full Schedule
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}
