import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddReportDialog } from "@/components/field/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IS_API, fetchMyVisitRows } from "@/lib/field/data";
import { useAuth } from "@/lib/auth/AuthContext";

export const Route = createFileRoute("/farm-visits")({ component: FarmVisitsPage });

function FarmVisitsPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["farm-visits", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: () => fetchMyVisitRows(session!.user.id),
  });
  // Demo reports have a review status; backend visits are upcoming or completed by date.
  const active = (data ?? []).filter((r) => ["pending", "under_review", "upcoming"].includes(r.status));
  const done = (data ?? []).filter((r) => ["approved", "reviewed", "completed"].includes(r.status));
  const groupLabels = IS_API ? ["Upcoming", "Completed"] : ["Pending review", "Completed"];
  return (
    <>
      <DashboardHeader title="Farm Visits" subtitle="Inspection reports awaiting review and completed visits." />
      <section className="rounded-2xl bg-card border border-border p-4 mb-4 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} total inspections</p>
        <AddReportDialog trigger={<Button>Start a visit</Button>} />
      </section>
      {isLoading && <div className="rounded-2xl bg-card border border-border p-6 animate-pulse h-40" />}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[{ label: groupLabels[0], list: active }, { label: groupLabels[1], list: done }].map((g) => (
            <section key={g.label} className="rounded-2xl bg-card border border-border p-6 shadow-sm">
              <h2 className="text-base font-semibold mb-3">{g.label}</h2>
              {g.list.length === 0 ? <p className="text-sm text-muted-foreground">Nothing here.</p> : (
                <ul className="divide-y divide-border">
                  {g.list.map((r: any) => (
                    <li key={r.id} className="py-3">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-medium">{r.farmers?.farm_name ?? "—"}</p>
                        <Badge variant="outline">{r.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.summary ?? "—"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-6">Also see <Link to="/reports" className="text-primary hover:underline">all reports</Link>.</p>
    </>
  );
}
