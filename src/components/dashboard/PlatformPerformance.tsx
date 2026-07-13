import { ChevronDown } from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { usePlatformSeries } from "@/hooks/useDashboard";

export function PlatformPerformance() {
  const { data: series } = usePlatformSeries();
  const data = series ?? [];
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Platform Performance</h2>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          Last 7 days <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-5 mb-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Users
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-info" /> Orders
        </span>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--info)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={2.5} fill="url(#usersFill)" dot={{ r: 3, fill: "var(--primary)" }} />
            <Area type="monotone" dataKey="orders" stroke="var(--info)" strokeWidth={2.5} fill="url(#ordersFill)" dot={{ r: 3, fill: "var(--info)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}