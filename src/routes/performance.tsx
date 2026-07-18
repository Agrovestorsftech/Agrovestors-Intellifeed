import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Target, Users, ClipboardCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { useFieldKpis } from "@/hooks/useDashboard";

export const Route = createFileRoute("/performance")({ component: PerformancePage });

function PerformancePage() {
  const { session } = useAuth();
  const kpis = useFieldKpis();
  const trend = useQuery({
    queryKey: ["perf-trend", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 27); since.setHours(0,0,0,0);
      const { data, error } = await supabase.from("visit_reports").select("submitted_at").eq("agent_id", session!.user.id).gte("submitted_at", since.toISOString());
      if (error) throw error;
      const buckets = Array.from({ length: 4 }, (_, i) => ({ week: `Week ${i+1}`, count: 0 }));
      for (const r of data ?? []) {
        const days = Math.floor((Date.now() - new Date(r.submitted_at).getTime()) / 86400000);
        const idx = 3 - Math.min(3, Math.floor(days / 7));
        buckets[idx].count++;
      }
      return buckets;
    },
  });
  const stats = [
    { icon: ClipboardCheck, label: "Visits this week", value: kpis.data?.completedThisWeek ?? 0, tone: "bg-primary-soft text-primary" },
    { icon: Users, label: "Farmers assigned", value: kpis.data?.assigned ?? 0, tone: "bg-info-soft text-info" },
    { icon: Target, label: "Weekly target", value: 20, tone: "bg-warning-soft text-warning-foreground" },
    { icon: TrendingUp, label: "Pending reports", value: kpis.data?.pendingReports ?? 0, tone: "bg-accent text-accent-foreground" },
  ];
  const max = Math.max(1, ...(trend.data ?? []).map((b: any) => b.count));
  return (
    <>
      <DashboardHeader title="My Performance" subtitle="Your visit metrics, targets and streaks." />
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card border border-border p-5 shadow-sm">
            <div className={`h-10 w-10 rounded-xl grid place-items-center ${s.tone}`}><s.icon className="h-5 w-5" /></div>
            <p className="mt-3 text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-4">Visits over the last 4 weeks</h2>
        <div className="flex items-end gap-3 h-40">
          {(trend.data ?? []).map((b: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary/80 rounded-t-lg transition-all" style={{ height: `${(b.count / max) * 100}%` }} />
              <span className="text-xs text-muted-foreground">{b.week}</span>
              <span className="text-xs font-medium">{b.count}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
