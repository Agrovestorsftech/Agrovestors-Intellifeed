import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Phone, MapPin, UserPlus } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddFarmerDialog, AddReportDialog } from "@/components/field/dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

export const Route = createFileRoute("/farmers")({ component: FarmersPage });

const statusStyle: Record<string, string> = {
  active: "bg-success-soft text-success",
  at_risk: "bg-warning-soft text-warning-foreground",
  inactive: "bg-muted text-muted-foreground",
};

function FarmersPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("id, name, farm_name, region, phone, livestock_type, status, avatar_url, notes, assigned_agent_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [q, setQ] = useState("");

  const claim = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("farmers").update({ assigned_agent_id: session?.user.id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["farmers"] }); toast.success("Farmer assigned to you"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((f: any) =>
      !t || f.name.toLowerCase().includes(t) ||
      (f.farm_name ?? "").toLowerCase().includes(t) ||
      (f.region ?? "").toLowerCase().includes(t) ||
      (f.livestock_type ?? "").toLowerCase().includes(t)
    );
  }, [data, q]);

  return (
    <>
      <DashboardHeader title="Farmers" subtitle="Manage the farmers in your territory." />
      <section className="rounded-2xl bg-card border border-border p-4 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search farmers, farms, region…" className="pl-9" />
        </div>
        <AddFarmerDialog trigger={<Button><UserPlus className="h-4 w-4 mr-2" />Add farmer</Button>} />
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 h-40 animate-pulse" />
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground text-center py-12">No farmers match your search.</p>
        )}
        {filtered.map((f: any) => (
          <article key={f.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="flex items-start gap-3">
              <img src={f.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.name)}`} alt={f.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-border" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{f.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{f.farm_name ?? "—"}</p>
              </div>
              <Badge className={statusStyle[f.status] ?? "bg-muted"}>{f.status}</Badge>
            </div>
            <dl className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              {f.region && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /><span>{f.region}</span></div>}
              {f.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{f.phone}</span></div>}
              <p className="pt-1 line-clamp-2 text-foreground/80">{f.livestock_type ?? "—"}</p>
            </dl>
            <div className="mt-4 flex gap-2">
              <AddReportDialog presetFarmerId={f.id} trigger={<Button size="sm" variant="outline" className="flex-1">Log visit</Button>} />
              {!f.assigned_agent_id && (
                <Button size="sm" onClick={() => claim.mutate(f.id)} disabled={claim.isPending}>Assign to me</Button>
              )}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
