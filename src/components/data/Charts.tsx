import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const CHART_COLORS = ["var(--primary)", "var(--info)", "var(--warning)", "var(--destructive)", "var(--chart-4, #8b5cf6)", "var(--muted-foreground)"];

const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--foreground)" };

export function ChartCard({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <div className="rounded-xl bg-muted motion-safe:animate-pulse" style={{ height }} aria-busy="true" />;
}

/** Simple vertical bar chart. `series` lists the data keys to draw (stacked when `stacked`). */
export function SimpleBars({
  data,
  x,
  series,
  height = 260,
  stacked,
  format,
}: {
  data: Record<string, unknown>[];
  x: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  stacked?: boolean;
  format?: (v: number) => string;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={x} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" tickFormatter={format} />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} contentStyle={tooltipStyle} formatter={(v: number) => (format ? format(v) : v)} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId={stacked ? "s" : undefined}
              fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              radius={stacked && i < series.length - 1 ? [0, 0, 0, 0] : [6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut with a legend listing each slice and its value. */
export function Donut({ data, height = 220, format }: { data: { name: string; value: number }[]; height?: number; format?: (v: number) => string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div style={{ height, width: height }} className="shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="95%" paddingAngle={2} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => (format ? format(v) : v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
            <span className="flex-1 text-foreground">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {format ? format(d.value) : d.value}
              {total > 0 && <span className="ml-1 text-xs">({Math.round((d.value / total) * 100)}%)</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ranked horizontal bars (top N). */
export function RankBars({ rows, format, empty = "No data yet." }: { rows: { name: string; value: number }[]; format?: (v: number) => string; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-foreground">{r.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{format ? format(r.value) : r.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
