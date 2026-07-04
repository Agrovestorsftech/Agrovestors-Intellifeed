import { CheckCircle2, Clock, CalendarClock } from "lucide-react";

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
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Today's Schedule</h2>

      <ol className="flex-1 space-y-5">
        {visits.map((v) => {
          const meta = statusMeta[v.status];
          return (
            <li key={v.time} className="flex items-center gap-4">
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

      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View Full Schedule
      </button>
    </section>
  );
}
