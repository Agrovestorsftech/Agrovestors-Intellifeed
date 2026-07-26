import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { HeartPulse, Salad, ClipboardList, CheckSquare } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FeedOpsKpiCard as KpiCard } from "@/components/dashboard/FeedOpsKpiCard";
import { useAgentKpis } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/agent/analytics")({ component: AnalyticsPage });

function useLast30DaysSeries() {
  return useQuery({
    queryKey: ["agent-analytics-series"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      since.setHours(0, 0, 0, 0);

      const [{ data: reports, error: e1 }, { data: cases, error: e2 }] = await Promise.all([
        supabase.from("visit_reports").select("submitted_at").gte("submitted_at", since.toISOString()),
        supabase.from("health_cases").select("created_at").gte("created_at", since.toISOString()),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const days: { day: string; reports: number; cases: number }[] = [];
      for (let i = 0; i < 30; i += 3) {
        const start = new Date(since);
        start.setDate(since.getDate() + i);
        const end = new Date(start);
        end.setDate(start.getDate() + 3);
        const label = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const reportCount = (reports ?? []).filter((r: any) => {
          const d = new Date(r.submitted_at);
          return d >= start && d < end;
        }).length;
        const caseCount = (cases ?? []).filter((c: any) => {
          const d = new Date(c.created_at);
          return d >= start && d < end;
        }).length;
        days.push({ day: label, reports: reportCount, cases: caseCount });
      }
      return days;
    },
  });
}

function AnalyticsPage() {
  const { data: kpis, isLoading: kpisLoading } = useAgentKpis();
  const { data: series, isLoading: seriesLoading, error } = useLast30DaysSeries();

  return (
    <>
      <DashboardHeader title="Analytics" subtitle="Activity across farms, reports, and health cases." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <KpiCard title="Active Farms" value={kpis?.activeFarms ?? 0} description="Under your care" icon={HeartPulse} tone="primary" loading={kpisLoading} />
        <KpiCard title="Nutrition Plans" value={kpis?.plans ?? 0} description="Active plans" icon={Salad} tone="primary" loading={kpisLoading} />
        <KpiCard title="Health Cases" value={kpis?.cases ?? 0} description="Active cases" icon={ClipboardList} tone="destructive" loading={kpisLoading} />
        <KpiCard title="Pending Tasks" value={kpis?.tasks ?? 0} description="Assigned to you" icon={CheckSquare} tone="warning" loading={kpisLoading} />
      </div>

      <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-1">Reports & cases — last 30 days</h2>
        <p className="text-xs text-muted-foreground mb-4">Grouped in 3-day buckets.</p>
        {error ? (
          <p className="text-sm text-destructive">Couldn't load analytics.</p>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series ?? []} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="reports" name="Visit reports" stroke="var(--info)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cases" name="Health cases" stroke="var(--destructive)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {seriesLoading && <p className="text-xs text-muted-foreground mt-2">Loading…</p>}
      </section>
    </>
  );
}
