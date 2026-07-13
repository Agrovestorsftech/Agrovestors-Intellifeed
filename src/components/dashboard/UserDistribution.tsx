import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useUserDistribution } from "@/hooks/useDashboard";

type Slice = { name: string; value: number; color: string };

const ROLE_META: Record<string, { name: string; color: string }> = {
  field_agent: { name: "Field Agents", color: "var(--info)" },
  admin_agent: { name: "Admin Agents", color: "oklch(0.55 0.22 295)" },
  feedops: { name: "FeedOps", color: "var(--warning)" },
  system_admin: { name: "System Admins", color: "var(--primary)" },
};

export function UserDistribution() {
  const { data } = useUserDistribution();
  const slices: Slice[] = Object.entries(data ?? {}).map(([role, value]) => ({
    name: ROLE_META[role]?.name ?? role,
    value,
    color: ROLE_META[role]?.color ?? "var(--muted-foreground)",
  }));
  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground mb-4">User Distribution</h2>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No user data yet.</p>
      ) : (
      <div className="flex items-center gap-6">
        <div className="relative h-[220px] w-[220px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                stroke="none"
              >
                {slices.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold text-foreground">{total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <ul className="flex-1 space-y-4">
          {slices.map((s) => {
            const pct = ((s.value / total) * 100).toFixed(1);
            return (
              <li key={s.name} className="flex items-start gap-3">
                <span
                  className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.value.toLocaleString()} ({pct}%)
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      )}
    </section>
  );
}