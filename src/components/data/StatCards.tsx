import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "warning" | "destructive" | "success" | "accent";
const TONE: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive-soft text-destructive",
  success: "bg-success-soft text-success",
  accent: "bg-accent text-accent-foreground",
};

export type Stat = { label: string; value: string | number; hint?: string; icon: LucideIcon; tone?: Tone };

/** Row of compact KPI cards for module pages. */
export function StatCards({ stats, loading }: { stats: Stat[]; loading?: boolean }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, hint, icon: Icon, tone = "primary" }) => (
        <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONE[tone]}`} aria-hidden="true">
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {loading ? <span className="inline-block h-7 w-14 rounded bg-muted align-middle motion-safe:animate-pulse" /> : value}
          </p>
          {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      ))}
    </div>
  );
}
