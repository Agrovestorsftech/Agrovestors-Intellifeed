import { AlertTriangle } from "lucide-react";
import { useCriticalAlerts } from "@/hooks/useDashboard";

type Priority = "Critical" | "High" | "Medium";

const priorityStyles: Record<Priority, string> = {
  Critical: "bg-destructive-soft text-destructive",
  High: "bg-warning-soft text-warning-foreground",
  Medium: "bg-info-soft text-info",
};

export function CriticalAlerts() {
  const { data, isLoading, error } = useCriticalAlerts();
  const alerts = data ?? [];
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Critical Alerts</h2>
      {error ? (
        <p className="text-sm text-destructive">Couldn't load alerts.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground flex-1 grid place-items-center">No critical alerts.</p>
      ) : (
      <ul className="flex-1 space-y-4">
        {alerts.map((a) => {
          return (
            <li key={a.id} className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-destructive-soft text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground truncate">{a.farm}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[a.priority as Priority]}`}>
                {a.priority}
              </span>
            </li>
          );
        })}
      </ul>
      )}
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View All Alerts
      </button>
    </section>
  );
}