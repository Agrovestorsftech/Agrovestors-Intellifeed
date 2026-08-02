import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Check, X } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/agent/reports-review")({ component: ReportsReviewPage });

const statusStyle: Record<string, string> = {
  pending: "bg-warning-soft text-warning-foreground",
  under_review: "bg-info-soft text-info",
  approved: "bg-success-soft text-success",
  reviewed: "bg-success-soft text-success",
  rejected: "bg-destructive-soft text-destructive",
};

function ReportsReviewPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_review");

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports-review"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_reports")
        .select("id, species, priority, status, summary, submitted_at, reviewed_at, farmers(name, farm_name)")
        .order("submitted_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("visit_reports")
        .update({ status, reviewed_by: session?.user.id ?? null, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ["reports-review"] });
      qc.invalidateQueries({ queryKey: ["pending-reports"] });
      qc.invalidateQueries({ queryKey: ["agent-kpis"] });
      toast.success(status === "approved" ? "Report approved" : "Report rejected");
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't update report"),
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((r: any) => {
      const matchesQ = !t ||
        (r.farmers?.name ?? "").toLowerCase().includes(t) ||
        (r.farmers?.farm_name ?? "").toLowerCase().includes(t) ||
        (r.summary ?? "").toLowerCase().includes(t);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending_review" ? ["pending", "under_review"].includes(r.status) : r.status === statusFilter);
      return matchesQ && matchesStatus;
    });
  }, [data, q, statusFilter]);

  return (
    <>
      <DashboardHeader title="Reports Review" subtitle="Approve or reject field visit reports." />
      <section className="rounded-2xl bg-card border border-border p-4 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by farmer, farm, summary…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending_review">Awaiting review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All reports</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-5 h-24 animate-pulse bg-muted/30" />)}
          {error && <p className="p-6 text-sm text-destructive">Couldn't load reports.</p>}
          {!isLoading && !error && filtered.length === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">Nothing here — you're all caught up.</p>
          )}
          {filtered.map((r: any) => {
            const pending = ["pending", "under_review"].includes(r.status);
            return (
              <div key={r.id} className="p-5 flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{r.farmers?.name ?? "Unknown farmer"}</h3>
                    <span className="text-xs text-muted-foreground">· {r.farmers?.farm_name ?? "—"}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.summary ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.species ?? "—"} · Submitted {relativeTime(r.submitted_at)}
                    {r.reviewed_at ? ` · Reviewed ${relativeTime(r.reviewed_at)}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Badge className={statusStyle[r.status] ?? "bg-muted"}>{r.status.replace("_", " ")}</Badge>
                    {r.priority !== "normal" && <Badge variant="outline">{r.priority}</Badge>}
                  </div>
                  {pending && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => review.mutate({ id: r.id, status: "rejected" })} disabled={review.isPending}>
                        <X className="h-4 w-4 mr-1" />Reject
                      </Button>
                      <Button size="sm" onClick={() => review.mutate({ id: r.id, status: "approved" })} disabled={review.isPending}>
                        <Check className="h-4 w-4 mr-1" />Approve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
