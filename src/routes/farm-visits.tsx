import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddReportDialog } from "@/components/field/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

export const Route = createFileRoute("/farm-visits")({ component: FarmVisitsPage });

function FarmVisitsPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["farm-visits", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_reports")
        .select("id, species, priority, status, summary, submitted_at, farmers(name, farm_name)")
        .eq("agent_id", session!.user.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const active = (data ?? []).filter((r: any) => r.status === "pending" || r.status === "under_review");
  const done = (data ?? []).filter((r: any) => r.status === "approved" || r.status === "reviewed");
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
          {[{ label: "Pending review", list: active }, { label: "Completed", list: done }].map((g) => (
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
