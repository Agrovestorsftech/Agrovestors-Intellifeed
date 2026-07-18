import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddReportDialog } from "@/components/field/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

const statusStyle: Record<string, string> = {
  pending: "bg-warning-soft text-warning-foreground",
  under_review: "bg-info-soft text-info",
  approved: "bg-success-soft text-success",
  reviewed: "bg-success-soft text-success",
  rejected: "bg-destructive-soft text-destructive",
};

function ReportsPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-reports", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_reports")
        .select("id, species, priority, status, summary, submitted_at, farmers(name, farm_name)")
        .eq("agent_id", session!.user.id)
        .order("submitted_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <>
      <DashboardHeader title="Reports" subtitle="Field reports you've submitted." />
      <section className="rounded-2xl bg-card border border-border p-4 shadow-sm mb-4 flex justify-end">
        <AddReportDialog trigger={<Button><FilePlus2 className="h-4 w-4 mr-2" />New report</Button>} />
      </section>
      <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-5 h-20 animate-pulse bg-muted/30" />)}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">No reports yet. Submit one from Quick Actions.</p>
          )}
          {(data ?? []).map((r: any) => (
            <div key={r.id} className="p-5 flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{r.farmers?.name ?? "Unknown farmer"}</h3>
                  <span className="text-xs text-muted-foreground">· {r.farmers?.farm_name ?? "—"}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.summary ?? "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.species ?? "—"} · Submitted {relativeTime(r.submitted_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={statusStyle[r.status] ?? "bg-muted"}>{r.status.replace("_", " ")}</Badge>
                {r.priority !== "normal" && <Badge variant="outline">{r.priority}</Badge>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
