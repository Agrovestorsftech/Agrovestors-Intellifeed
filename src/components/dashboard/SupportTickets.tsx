import { LogIn, RefreshCcw, FileWarning } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Priority = "High" | "Medium" | "Low";

const priorityStyles: Record<Priority, string> = {
  High: "bg-destructive-soft text-destructive",
  Medium: "bg-warning-soft text-warning-foreground",
  Low: "bg-info-soft text-info",
};

type Ticket = { icon: LucideIcon; title: string; priority: Priority; number: string };

const tickets: Ticket[] = [
  { icon: LogIn, title: "Login issue reported", priority: "High", number: "#TK-3456" },
  { icon: RefreshCcw, title: "App not syncing data", priority: "Medium", number: "#TK-3455" },
  { icon: FileWarning, title: "Report generation failed", priority: "Low", number: "#TK-3454" },
];

export function SupportTickets() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Support Tickets</h2>
      <ul className="flex-1 space-y-4">
        {tickets.map((t) => {
          const Icon = t.icon;
          return (
            <li key={t.number} className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <p className="flex-1 min-w-0 text-sm text-foreground truncate">{t.title}</p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[t.priority]}`}
              >
                {t.priority}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap w-16 text-right">{t.number}</span>
            </li>
          );
        })}
      </ul>
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View All Tickets
      </button>
    </section>
  );
}