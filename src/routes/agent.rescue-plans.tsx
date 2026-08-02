import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/agent/rescue-plans")({ component: RescuePlansPage });

const severityStyle: Record<string, string> = {
  high: "bg-destructive-soft text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

/**
 * "Rescue Plans" = urgent, unresolved health cases (high/critical severity)
 * that need an active treatment plan right now. There is no separate
 * rescue_plans table in the schema — this view is health_cases filtered
 * to the urgent subset, with the treatment field acting as the plan.
 */
function RescuePlansPage() {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["rescue-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_cases")
        .select("id, severity, status, diagnosis, treatment, created_at, farmers(name, farm_name, livestock_type)")
        .in("severity", ["high", "critical"])
        .neq("status", "resolved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveTreatment = useMutation({
    mutationFn: async ({ id, treatment }: { id: string; treatment: string }) => {
      const { error } = await supabase.from("health_cases").update({ treatment, status: "in_progress" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["rescue-plans"] });
      qc.invalidateQueries({ queryKey: ["critical-alerts"] });
      setDrafts((d) => { const next = { ...d }; delete next[id]; return next; });
      toast.success("Rescue plan saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't save plan"),
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("health_cases").update({ status: "resolved" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rescue-plans"] });
      qc.invalidateQueries({ queryKey: ["critical-alerts"] });
      toast.success("Case resolved");
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't resolve case"),
  });

  return (
    <>
      <DashboardHeader title="Rescue Plans" subtitle="Urgent, unresolved cases that need an active treatment plan." />
      <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-5 h-28 animate-pulse bg-muted/30" />)}
          {error && <p className="p-6 text-sm text-destructive">Couldn't load rescue cases.</p>}
          {!isLoading && !error && (data?.length ?? 0) === 0 && (
            <div className="p-10 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No urgent cases right now — nothing needs a rescue plan.</p>
            </div>
          )}
          {(data ?? []).map((c: any) => (
            <div key={c.id} className="p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{c.farmers?.name ?? "Unknown farmer"}</h3>
                    <span className="text-xs text-muted-foreground">· {c.farmers?.farm_name ?? "—"} · {c.farmers?.livestock_type ?? "—"}</span>
                  </div>
                  <p className="mt-1 text-sm text-foreground/90">{c.diagnosis ?? "No diagnosis recorded yet."}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Opened {relativeTime(c.created_at)}</p>
                </div>
                <Badge className={severityStyle[c.severity] ?? "bg-muted"}>{c.severity}</Badge>
              </div>
              <div>
                <Textarea
                  rows={2}
                  placeholder="Write the rescue / treatment plan…"
                  value={drafts[c.id] ?? c.treatment ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => resolve.mutate(c.id)} disabled={resolve.isPending}>
                  Mark resolved
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveTreatment.mutate({ id: c.id, treatment: (drafts[c.id] ?? c.treatment ?? "").trim() })}
                  disabled={saveTreatment.isPending || !(drafts[c.id] ?? c.treatment ?? "").trim()}
                >
                  {saveTreatment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save plan
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
