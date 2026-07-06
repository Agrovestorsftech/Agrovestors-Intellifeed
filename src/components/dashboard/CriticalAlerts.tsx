import { AlertTriangle, TrendingDown, Activity, Bug, PackageX } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Priority = "Critical" | "High" | "Medium";

const priorityStyles: Record<Priority, string> = {
  Critical: "bg-destructive-soft text-destructive",
  High: "bg-warning-soft text-warning-foreground",
  Medium: "bg-info-soft text-info",
};

type Alert = { icon: LucideIcon; title: string; farm: string; priority: Priority };

const alerts: Alert[] = [
  { icon: AlertTriangle, title: "High mortality reported", farm: "Green Valley Farm", priority: "Critical" },
  { icon: TrendingDown, title: "Rapid weight loss detected", farm: "Ade's Farm", priority: "High" },
  { icon: Activity, title: "Poor feed conversion observed", farm: "Sunnyvale Farm", priority: "Medium" },
  { icon: Bug, title: "Disease symptoms reported", farm: "Hilltop Farm", priority: "High" },
  { icon: PackageX, title: "Feed shortage warning", farm: "Riverbend Farm", priority: "Medium" },
];

export function CriticalAlerts() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Critical Alerts</h2>
      <ul className="flex-1 space-y-4">
        {alerts.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.title} className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-destructive-soft text-destructive">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground truncate">{a.farm}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[a.priority]}`}>
                {a.priority}
              </span>
            </li>
          );
        })}
      </ul>
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View All Alerts
      </button>
    </section>
  );
}