import { Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";
import { useSupportTickets } from "@/hooks/useDashboard";

type Priority = "High" | "Medium" | "Low";

const priorityStyles: Record<Priority, string> = {
  High: "bg-destructive-soft text-destructive",
  Medium: "bg-warning-soft text-warning-foreground",
  Low: "bg-info-soft text-info",
};

export function SupportTickets() {
  const { data, isLoading, error } = useSupportTickets();
  const tickets = data ?? [];
  // Tone only; the badge shows the ticket's own priority (low, normal, high, urgent).
  function normPriority(p: string): Priority {
    const k = p.toLowerCase();
    if (k === "high" || k === "urgent" || k === "critical") return "High";
    if (k === "medium" || k === "normal") return "Medium";
    return "Low";
  }
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Support Tickets</h2>
      {error ? (
        <p className="text-sm text-destructive">Couldn't load tickets.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center flex-1 grid place-items-center">No open tickets.</p>
      ) : (
      <ul className="flex-1 space-y-4">
        {tickets.map((t: any) => {
          const p = normPriority(t.priority);
          return (
            <li key={t.id} className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-accent text-accent-foreground">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <p className="flex-1 min-w-0 text-sm text-foreground truncate">{t.subject}</p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[p]}`}
              >
                {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
              </span>
            </li>
          );
        })}
      </ul>
      )}
      <Link
        to="/admin/support-tickets"
        className="mt-6 block w-full rounded-xl border border-border px-3 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        View All Tickets
      </Link>
    </section>
  );
}