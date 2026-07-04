import { UserPlus, ShoppingCart, DatabaseBackup, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "warning" | "accent";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning-foreground",
  accent: "bg-accent text-accent-foreground",
};

type Log = { icon: LucideIcon; title: string; time: string; tone: Tone };

const logs: Log[] = [
  { icon: UserPlus, title: "New farmer registered: Green Valley Farm", time: "2 mins ago", tone: "primary" },
  { icon: ShoppingCart, title: "Feed order #ORD-1256 completed", time: "15 mins ago", tone: "warning" },
  { icon: DatabaseBackup, title: "System backup completed successfully", time: "1 hour ago", tone: "info" },
  { icon: UserCog, title: "User role updated: Jane Doe", time: "2 hours ago", tone: "accent" },
];

export function SystemLogs() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Recent System Logs</h2>
      <ul className="flex-1 space-y-4">
        {logs.map((l) => {
          const Icon = l.icon;
          return (
            <li key={l.title} className="flex items-center gap-3">
              <div className={`h-9 w-9 shrink-0 grid place-items-center rounded-xl ${toneStyles[l.tone]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="flex-1 min-w-0 text-sm text-foreground truncate">{l.title}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{l.time}</span>
            </li>
          );
        })}
      </ul>
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View All Logs
      </button>
    </section>
  );
}