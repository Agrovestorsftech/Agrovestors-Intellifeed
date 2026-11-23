import { useState } from "react";
import { useVisitSummary } from "@/hooks/useDashboard";
import type { SummaryPeriod } from "@/lib/dashboard/queries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PERIOD_LABEL: Record<SummaryPeriod, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

export function VisitSummary() {
  const [period, setPeriod] = useState<SummaryPeriod>("week");
  const { data, isLoading, isError } = useVisitSummary(period);
  const total = data?.total ?? 0;
  const completed = data?.completed ?? 0;
  const pending = data?.pending ?? 0;
  const missed = data?.missed ?? 0;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const size = 180;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  const stat = (label: string, value: number, dot: string) => (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
        {isLoading ? <span className="inline-block h-6 w-8 rounded bg-muted align-middle motion-safe:animate-pulse" /> : isError ? "—" : value}
      </dd>
    </div>
  );

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">My Visit Summary</h2>
        <Select value={period} onValueChange={(v) => setPeriod(v as SummaryPeriod)}>
          <SelectTrigger className="h-9 w-[132px] rounded-xl text-sm" aria-label="Summary period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIOD_LABEL) as SummaryPeriod[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PERIOD_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--muted)" strokeWidth={stroke} fill="none" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="oklch(0.55 0.22 295)"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-3xl font-semibold tabular-nums text-foreground">{isError ? "—" : `${percent}%`}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Visits completed</p>
            </div>
          </div>
        </div>

        <dl className="space-y-3 pr-2">
          {stat("Planned", total, "bg-muted-foreground/40")}
          {stat("Completed", completed, "bg-[oklch(0.55_0.22_295)]")}
          {stat("Pending", pending, "bg-info")}
          {missed > 0 && stat("Missed", missed, "bg-destructive")}
        </dl>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        {isError
          ? "Couldn't load your visit summary."
          : total === 0
            ? `No visits planned ${PERIOD_LABEL[period].toLowerCase()}.`
            : `${completed} of ${total} planned visits completed ${PERIOD_LABEL[period].toLowerCase()}.`}
      </p>
    </section>
  );
}
