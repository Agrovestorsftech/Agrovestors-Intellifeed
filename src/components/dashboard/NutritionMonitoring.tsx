import { ChevronDown } from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  LineChart,
} from "recharts";

const data = [
  { day: "Mon", compliance: 82, effectiveness: 78, weight: 74 },
  { day: "Tue", compliance: 85, effectiveness: 80, weight: 76 },
  { day: "Wed", compliance: 88, effectiveness: 82, weight: 79 },
  { day: "Thu", compliance: 86, effectiveness: 84, weight: 81 },
  { day: "Fri", compliance: 90, effectiveness: 87, weight: 83 },
  { day: "Sat", compliance: 92, effectiveness: 88, weight: 85 },
  { day: "Sun", compliance: 94, effectiveness: 90, weight: 88 },
];

export function NutritionMonitoring() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Nutrition Monitoring</h2>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          Last 30 Days <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Compliance
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-info" /> Effectiveness
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Weight
        </span>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} domain={[60, 100]} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="compliance" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--primary)" }} />
            <Line type="monotone" dataKey="effectiveness" stroke="var(--info)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--info)" }} />
            <Line type="monotone" dataKey="weight" stroke="var(--warning)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--warning)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}