import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Salad } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddNutritionPlanDialog } from "@/components/agent/dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/agent/nutrition-plans")({ component: NutritionPlansPage });

const statusStyle: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success-soft text-success",
  archived: "bg-warning-soft text-warning-foreground",
};

function NutritionPlansPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["nutrition-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nutrition_plans")
        .select("id, species, status, effective_from, created_at, plan, farmers(name, farm_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("nutrition_plans").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nutrition-plans"] }); toast.success("Plan updated"); },
    onError: (e: any) => toast.error(e.message ?? "Couldn't update plan"),
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((p: any) => {
      const matchesQ = !t ||
        (p.farmers?.name ?? "").toLowerCase().includes(t) ||
        (p.farmers?.farm_name ?? "").toLowerCase().includes(t) ||
        (p.species ?? "").toLowerCase().includes(t);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [data, q, statusFilter]);

  return (
    <>
      <DashboardHeader title="Nutrition Plans" subtitle="Create, update and manage nutrition plans." />
      <section className="rounded-2xl bg-card border border-border p-4 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by farmer, farm, species…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <AddNutritionPlanDialog trigger={<Button><Salad className="h-4 w-4 mr-2" />New plan</Button>} />
      </section>

      <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-5 h-20 animate-pulse bg-muted/30" />)}
          {error && <p className="p-6 text-sm text-destructive">Couldn't load nutrition plans.</p>}
          {!isLoading && !error && filtered.length === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">No nutrition plans match your filters.</p>
          )}
          {filtered.map((p: any) => (
            <div key={p.id} className="p-5 flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{p.farmers?.name ?? "Unknown farmer"}</h3>
                  <span className="text-xs text-muted-foreground">· {p.farmers?.farm_name ?? "—"}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {(p.plan && typeof p.plan === "object" && (p.plan as any).notes) || "No plan notes provided."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.species ?? "—"} · Created {relativeTime(p.created_at)}
                  {p.effective_from ? ` · Effective ${new Date(p.effective_from).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={statusStyle[p.status] ?? "bg-muted"}>{p.status}</Badge>
                <div className="flex gap-2">
                  {p.status !== "active" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: p.id, status: "active" })} disabled={updateStatus.isPending}>
                      Activate
                    </Button>
                  )}
                  {p.status !== "archived" && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: p.id, status: "archived" })} disabled={updateStatus.isPending}>
                      Archive
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
