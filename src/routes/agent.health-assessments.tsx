import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Stethoscope } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddHealthCaseDialog } from "@/components/agent/dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/agent/health-assessments")({ component: HealthAssessmentsPage });

const severityStyle: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning-soft text-warning-foreground",
  high: "bg-destructive-soft text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

const statusStyle: Record<string, string> = {
  open: "bg-warning-soft text-warning-foreground",
  in_progress: "bg-info-soft text-info",
  resolved: "bg-success-soft text-success",
};

function HealthAssessmentsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["health-cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_cases")
        .select("id, severity, status, diagnosis, treatment, created_at, farmers(name, farm_name, livestock_type)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("health_cases").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-cases"] });
      qc.invalidateQueries({ queryKey: ["agent-kpis"] });
      qc.invalidateQueries({ queryKey: ["critical-alerts"] });
      toast.success("Case updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't update case"),
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((c: any) => {
      const matchesQ = !t ||
        (c.farmers?.name ?? "").toLowerCase().includes(t) ||
        (c.farmers?.farm_name ?? "").toLowerCase().includes(t) ||
        (c.diagnosis ?? "").toLowerCase().includes(t);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [data, q, statusFilter]);

  return (
    <>
      <DashboardHeader title="Health Assessments" subtitle="Diagnose, treat, and track livestock health cases." />
      <section className="rounded-2xl bg-card border border-border p-4 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by farmer, farm, diagnosis…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <AddHealthCaseDialog trigger={<Button><Stethoscope className="h-4 w-4 mr-2" />New case</Button>} />
      </section>

      <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-5 h-24 animate-pulse bg-muted/30" />)}
          {error && <p className="p-6 text-sm text-destructive">Couldn't load health cases.</p>}
          {!isLoading && !error && filtered.length === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">No health cases match your filters.</p>
          )}
          {filtered.map((c: any) => (
            <div key={c.id} className="p-5 flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{c.farmers?.name ?? "Unknown farmer"}</h3>
                  <span className="text-xs text-muted-foreground">· {c.farmers?.farm_name ?? "—"} · {c.farmers?.livestock_type ?? "—"}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/90 line-clamp-2">{c.diagnosis ?? "No diagnosis recorded yet."}</p>
                {c.treatment && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">Treatment: {c.treatment}</p>}
                <p className="mt-1 text-xs text-muted-foreground">Opened {relativeTime(c.created_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <Badge className={severityStyle[c.severity] ?? "bg-muted"}>{c.severity}</Badge>
                  <Badge className={statusStyle[c.status] ?? "bg-muted"}>{c.status.replace("_", " ")}</Badge>
                </div>
                <div className="flex gap-2">
                  {c.status !== "in_progress" && c.status !== "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: c.id, status: "in_progress" })} disabled={updateStatus.isPending}>
                      Start treatment
                    </Button>
                  )}
                  {c.status !== "resolved" && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: c.id, status: "resolved" })} disabled={updateStatus.isPending}>
                      Mark resolved
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
