import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddHealthCaseDialog } from "@/components/agent/dialogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardGridSkeleton, FilterHeaderSkeleton } from "@/components/ui/lazy-loader";
import { supabase } from "@/integrations/supabase/client";
import { relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/agent/farmer-reviews")({ component: FarmerReviewsPage });

const statusStyle: Record<string, string> = {
  active: "bg-success-soft text-success",
  at_risk: "bg-warning-soft text-warning-foreground",
  inactive: "bg-muted text-muted-foreground",
};

function FarmerReviewsPage() {
  const [q, setQ] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["farmer-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select(`
          id, name, farm_name, region, livestock_type, status, avatar_url, updated_at,
          health_cases(id, severity, status),
          visit_reports(id, status, submitted_at)
        `)
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((f: any) =>
      !t || f.name.toLowerCase().includes(t) ||
      (f.farm_name ?? "").toLowerCase().includes(t) ||
      (f.region ?? "").toLowerCase().includes(t)
    );
  }, [data, q]);

  return (
    <>
      <DashboardHeader title="Farmer Reviews" subtitle="Cross-reference farmer history, health cases, and report activity." />
      
      {isLoading ? (
        <FilterHeaderSkeleton />
      ) : (
        <section className="rounded-2xl bg-card border border-border p-4 shadow-sm mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search farmers, farms, region…" className="pl-9" />
          </div>
        </section>
      )}

      {isLoading ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardGridSkeleton key={i} />
          ))}
        </section>
      ) : error ? (
        <section className="col-span-full rounded-2xl bg-card border border-destructive/20 shadow-sm p-6">
          <p className="text-sm text-destructive">Couldn't load farmers.</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-2xl bg-card border border-border shadow-sm p-10">
          <p className="text-center text-sm text-muted-foreground">No farmers match your search.</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((f: any) => {
            const openCases = (f.health_cases ?? []).filter((c: any) => c.status !== "resolved");
            const reportCount = (f.visit_reports ?? []).length;
            const pendingReports = (f.visit_reports ?? []).filter((r: any) => ["pending", "under_review"].includes(r.status)).length;
            return (
              <article key={f.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start gap-3">
                  <img
                    src={f.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.name)}`}
                    alt={f.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{f.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{f.farm_name ?? "—"}</p>
                  </div>
                  <Badge className={statusStyle[f.status] ?? "bg-muted"}>{f.status}</Badge>
                </div>
                <dl className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  {f.region && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /><span>{f.region}</span></div>}
                  <p className="text-foreground/80">{f.livestock_type ?? "—"}</p>
                  <p>Reviewed {relativeTime(f.updated_at)}</p>
                </dl>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-muted/40 py-2">
                    <p className="text-lg font-semibold text-foreground">{openCases.length}</p>
                    <p className="text-[10px] text-muted-foreground">Open cases</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 py-2">
                    <p className="text-lg font-semibold text-foreground">{reportCount}</p>
                    <p className="text-[10px] text-muted-foreground">Reports ({pendingReports} pending)</p>
                  </div>
                </div>
                <div className="mt-4">
                  <AddHealthCaseDialog presetFarmerId={f.id} trigger={<Button size="sm" variant="outline" className="w-full">Open health case</Button>} />
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
