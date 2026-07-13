import { Activity } from "lucide-react";
import { useSystemLogs } from "@/hooks/useDashboard";
import { relativeTime } from "@/lib/dashboard/queries";

export function SystemLogs() {
  const { data, isLoading, error } = useSystemLogs();
  const logs = data ?? [];
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Recent System Logs</h2>
      {error ? (
        <p className="text-sm text-destructive">Couldn't load logs.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center flex-1 grid place-items-center">No system logs yet.</p>
      ) : (
      <ul className="flex-1 space-y-4">
        {logs.map((l: any) => (
            <li key={l.id} className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-info-soft text-info">
                <Activity className="h-4 w-4" />
              </div>
              <p className="flex-1 min-w-0 text-sm text-foreground truncate">{l.action}{l.entity ? ` · ${l.entity}` : ""}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(l.created_at)}</span>
            </li>
          ))}
      </ul>
      )}
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View All Logs
      </button>
    </section>
  );
}