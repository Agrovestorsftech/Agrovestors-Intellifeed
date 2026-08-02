import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/agent/research-insights")({ component: ResearchInsightsPage });

const PIE_COLORS = ["var(--info)", "var(--warning)", "var(--destructive)", "var(--success)"];

/**
 * There is no dedicated "research" table in the schema. This page derives
 * livestock-health and species trends from health_cases, nutrition_plans,
 * and farmers so it's real data rather than an invented table. If a real
 * research/insights table gets added later, swap the queries below.
 */
function ResearchInsightsPage() {
  const severityQuery = useQuery({
    queryKey: ["research-severity"],
    queryFn: async () => {
      const { data, error } = await supabase.from("health_cases").select("severity");
      if (error) throw error;
      const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
      for (const r of data ?? []) counts[r.severity] = (counts[r.severity] ?? 0) + 1;
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const speciesQuery = useQuery({
    queryKey: ["research-species"],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmers").select("livestock_type");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const r of data ?? []) {
        const key = r.livestock_type ?? "Unspecified";
        counts[key] = (counts[key] ?? 0) + 1;
      }
      return Object.entries(counts).map(([species, farms]) => ({ species, farms }));
    },
  });

  const planStatusQuery = useQuery({
    queryKey: ["research-plan-status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("nutrition_plans").select("status");
      if (error) throw error;
      const counts: Record<string, number> = { draft: 0, active: 0, archived: 0 };
      for (const r of data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  return (
    <>
      <DashboardHeader title="Research Insights" subtitle="Trends across health cases, species, and nutrition plans." />

      <div className="rounded-2xl bg-info-soft border border-info/20 p-4 mb-6 flex items-start gap-3">
        <Info className="h-4 w-4 text-info mt-0.5 shrink-0" />
        <p className="text-xs text-info">
          These charts are derived from existing farm, health, and nutrition data — there's no separate research
          dataset yet, so this is a live view of the patterns already in your data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">Health cases by severity</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityQuery.data ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {(severityQuery.data ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">Farms by livestock type</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={speciesQuery.data ?? []} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="species" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="farms" fill="var(--primary)" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground mb-4">Nutrition plans by status</h2>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planStatusQuery.data ?? []} layout="vertical" margin={{ top: 10, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="value" fill="var(--success)" radius={[0, 8, 8, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  );
}
