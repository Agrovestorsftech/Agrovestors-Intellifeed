import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddReportDialog } from "@/components/field/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

export const Route = createFileRoute("/my-visits")({ component: MyVisitsPage });

function MyVisitsPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-visits", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_reports")
        .select("id, species, status, submitted_at, farmers(farm_name, region)")
        .eq("agent_id", session!.user.id)
        .order("submitted_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const groups: { today: any[]; week: any[]; older: any[] } = { today: [], week: [], older: [] };
  const startToday = new Date(); startToday.setHours(0,0,0,0);
  const startWeek = new Date(); startWeek.setDate(startWeek.getDate() - 7);
  for (const v of data ?? []) {
    const t = new Date(v.submitted_at);
    if (t >= startToday) groups.today.push(v);
    else if (t >= startWeek) groups.week.push(v);
    else groups.older.push(v);
  }
  const Row = ({ v }: { v: any }) => (
    <div className="flex items-center gap-3 py-3">
      <div className="h-10 w-10 rounded-xl bg-primary-soft grid place-items-center text-primary"><CalendarDays className="h-4 w-4" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{v.farmers?.farm_name ?? "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{v.farmers?.region ?? "—"} · {v.species ?? "—"}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{new Date(v.submitted_at).toLocaleString()}</p>
        <Badge variant="outline" className="mt-1">{v.status.replace("_", " ")}</Badge>
      </div>
    </div>
  );
  return (
    <>
      <DashboardHeader title="My Visits" subtitle="Everything you have visited and are planning to visit." />
      <section className="rounded-2xl bg-card border border-border p-4 mb-4 flex justify-end">
        <AddReportDialog trigger={<Button>Log a visit</Button>} />
      </section>
      {isLoading ? <div className="rounded-2xl bg-card border border-border p-6 animate-pulse h-40" /> : (
        <div className="space-y-6">
          {(["today","week","older"] as const).map((k) => (
            <section key={k} className="rounded-2xl bg-card border border-border p-6 shadow-sm">
              <h2 className="text-base font-semibold mb-2">{k === "today" ? "Today" : k === "week" ? "This week" : "Older"}</h2>
              {groups[k].length === 0
                ? <p className="text-sm text-muted-foreground py-2">Nothing here yet.</p>
                : <div className="divide-y divide-border">{groups[k].map((v: any) => <Row key={v.id} v={v} />)}</div>}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
