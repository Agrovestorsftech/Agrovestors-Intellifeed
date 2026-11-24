import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddReportDialog } from "@/components/field/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockDb as db } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth/AuthContext";
import { relativeTime } from "@/lib/dashboard/queries";
import { IS_API } from "@/lib/field/data";
import { fetchReviewReports } from "@/lib/agent/data";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

const statusStyle: Record<string, string> = {
  pending: "bg-warning-soft text-warning-foreground",
  under_review: "bg-info-soft text-info",
  approved: "bg-success-soft text-success",
  reviewed: "bg-success-soft text-success",
  rejected: "bg-destructive-soft text-destructive",
  // Backend report statuses (apps/reports): farmers submit, agents review or flag.
  submitted: "bg-warning-soft text-warning-foreground",
  flagged: "bg-destructive-soft text-destructive",
};

// api mode: /reports/ is the cycle reports farmers send from the farms this
// agent is assigned to (field agents can read them but don't submit them).
async function fetchFarmReports() {
  const rows = await fetchReviewReports();
  return rows
    .map((r) => ({ ...r, status: String(r.backend_status) }) as Record<string, unknown>)
    .sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)));
}

function ReportsPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-reports", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: IS_API ? fetchFarmReports : async () => {
      const { data, error } = await db
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
      <DashboardHeader
        title="Reports"
        subtitle={IS_API ? "Cycle reports farmers send from the farms you look after." : "Field reports you've submitted."}
      />
      <section className="rounded-2xl bg-card border border-border p-4 shadow-sm mb-4 flex justify-end">
        {/* In api mode this opens Log visit: agents record visits, farmers send cycle reports. */}
        <AddReportDialog trigger={<Button><FilePlus2 className="h-4 w-4 mr-2" />{IS_API ? "Log visit" : "New report"}</Button>} />
      </section>
      <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-5 h-20 animate-pulse bg-muted/30" />)}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">
              {IS_API ? "No reports from your farms yet." : "No reports yet. Submit one from Quick Actions."}
            </p>
          )}
          {(data ?? []).map((r: any) => (
            <div key={r.id} className="p-5 flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{r.farmers?.name ?? (IS_API ? "Farmer" : "Unknown farmer")}</h3>
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
