import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { ChartCard, ChartSkeleton, Donut, RankBars, SimpleBars } from "@/components/data/Charts";
import { downloadCsv } from "@/components/data/csv";
import { humanize } from "@/components/data/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  listFarmers,
  listHealthCases,
  listOrders,
  listUsers,
  listVisits,
  nairaShort,
  staffNamer,
} from "@/lib/ops/api";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — IntelliFeed360" }] }),
  component: AdminReportsPage,
});

type Row = Record<string, any>;

function weekStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function tally(rows: Row[], key: (r: Row) => string) {
  const out: Record<string, number> = {};
  for (const r of rows) out[key(r)] = (out[key(r)] ?? 0) + 1;
  return Object.entries(out)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function AdminReportsPage() {
  const [weeks, setWeeks] = useState(8);
  const me = useAuth().session?.user;
  const farmers = useQuery({ queryKey: ["admin-farmers"], queryFn: listFarmers });
  const visits = useQuery({ queryKey: ["admin-visits"], queryFn: listVisits });
  const cases = useQuery({ queryKey: ["admin-cases"], queryFn: listHealthCases });
  const orders = useQuery({ queryKey: ["ops-orders"], queryFn: listOrders });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const all = [farmers, visits, cases, orders, users];
  const loading = all.some((x) => x.isLoading);
  const error = all.find((x) => x.error)?.error;
  const agentName = staffNamer(users.data ?? [], me);

  const first = weekStart(new Date());
  first.setDate(first.getDate() - (weeks - 1) * 7);
  const inWeek = (iso: string | null | undefined, s: Date) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t >= s.getTime() && t < s.getTime() + 7 * 86_400_000;
  };
  const trend = Array.from({ length: weeks }, (_, i) => {
    const s = new Date(first);
    s.setDate(first.getDate() + i * 7);
    const ords = (orders.data ?? []).filter((o) => inWeek(o.placed_at, s));
    return {
      week: s.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      visits: (visits.data ?? []).filter((v) => inWeek(v.submitted_at, s)).length,
      cases: (cases.data ?? []).filter((c) => inWeek(c.created_at, s)).length,
      farmers: (farmers.data ?? []).filter((f) => inWeek(f.created_at, s)).length,
      revenue: ords.reduce(
        (t, o) => t + Number(o.quantity) * Number(o.feed_products?.price_per_unit ?? 0),
        0,
      ),
    };
  });

  const byRegion = tally(farmers.data ?? [], (f) => f.region);
  const bySpecies = tally(farmers.data ?? [], (f) => humanize(f.livestock_type ?? "other"));
  const bySeverity = ["critical", "high", "medium", "low"].map((s) => ({
    name: humanize(s),
    value: (cases.data ?? []).filter((c) => c.severity === s && c.status !== "resolved").length,
  }));
  const byDiagnosis = tally(cases.data ?? [], (c) => c.diagnosis).slice(0, 6);
  const topAgents = tally(visits.data ?? [], (v) => agentName(v.agent_id)).slice(0, 6);
  const approval = (() => {
    const done = (visits.data ?? []).filter(
      (v) => v.status === "approved" || v.status === "rejected",
    );
    return done.length
      ? Math.round((done.filter((v) => v.status === "approved").length / done.length) * 100)
      : 0;
  })();

  const exports: { label: string; run: () => void }[] = [
    {
      label: "Farmers",
      run: () =>
        downloadCsv(
          "farmers.csv",
          (farmers.data ?? []).map((f) => ({
            name: f.name,
            farm: f.farm_name,
            region: f.region,
            livestock: f.livestock_type,
            status: f.status,
            joined: f.created_at,
          })),
        ),
    },
    {
      label: "Visits",
      run: () =>
        downloadCsv(
          "visits.csv",
          (visits.data ?? []).map((v) => ({
            farmer: v.farmers?.name,
            agent: agentName(v.agent_id),
            priority: v.priority,
            status: v.status,
            summary: v.summary,
            submitted: v.submitted_at,
          })),
        ),
    },
    {
      label: "Health cases",
      run: () =>
        downloadCsv(
          "health-cases.csv",
          (cases.data ?? []).map((c) => ({
            farmer: c.farmers?.name,
            region: c.farmers?.region,
            diagnosis: c.diagnosis,
            severity: c.severity,
            status: c.status,
            vet: c.assigned_to,
            opened: c.created_at,
          })),
        ),
    },
    { label: "Weekly trend", run: () => downloadCsv("weekly-trend.csv", trend) },
  ];

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Platform-wide trends across farmers, field activity, animal health and feed sales."
        actions={
          <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
            <SelectTrigger className="h-10 w-36" aria-label="Time range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">Last 4 weeks</SelectItem>
              <SelectItem value="8">Last 8 weeks</SelectItem>
              <SelectItem value="12">Last 12 weeks</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-border bg-card p-6 text-sm text-foreground"
        >
          Couldn't load report data.{" "}
          <button
            className="font-medium text-primary underline"
            onClick={() => all.forEach((x) => x.refetch())}
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Field activity"
          subtitle="Visit reports vs new health cases per week"
          className="lg:col-span-2"
        >
          {loading ? (
            <ChartSkeleton />
          ) : (
            <SimpleBars
              data={trend}
              x="week"
              series={[
                { key: "visits", label: "Visit reports" },
                { key: "cases", label: "Health cases", color: "var(--warning)" },
              ]}
            />
          )}
        </ChartCard>
        <ChartCard title="Feed sales" subtitle="Order value placed per week">
          {loading ? (
            <ChartSkeleton height={220} />
          ) : (
            <SimpleBars
              data={trend}
              x="week"
              series={[{ key: "revenue", label: "Order value" }]}
              height={220}
              format={nairaShort}
            />
          )}
        </ChartCard>
        <ChartCard title="New farmers" subtitle="Registrations per week">
          {loading ? (
            <ChartSkeleton height={220} />
          ) : (
            <SimpleBars
              data={trend}
              x="week"
              series={[{ key: "farmers", label: "New farmers", color: "var(--info)" }]}
              height={220}
            />
          )}
        </ChartCard>
        <ChartCard title="Farmers by livestock">
          {loading ? <ChartSkeleton height={200} /> : <Donut data={bySpecies} height={200} />}
        </ChartCard>
        <ChartCard title="Farmers by region">
          {loading ? <ChartSkeleton height={200} /> : <RankBars rows={byRegion} />}
        </ChartCard>
        <ChartCard title="Open cases by severity">
          {loading ? (
            <ChartSkeleton height={200} />
          ) : (
            <Donut data={bySeverity.filter((d) => d.value > 0)} height={200} />
          )}
        </ChartCard>
        <ChartCard title="Most common diagnoses" subtitle="All time">
          {loading ? (
            <ChartSkeleton height={200} />
          ) : (
            <RankBars rows={byDiagnosis} format={(v) => `${v} cases`} />
          )}
        </ChartCard>
        <ChartCard
          title="Most active field agents"
          subtitle={`Visit reports · ${approval}% approval rate overall`}
        >
          {loading ? (
            <ChartSkeleton height={200} />
          ) : (
            <RankBars rows={topAgents} format={(v) => `${v} visits`} />
          )}
        </ChartCard>
        <ChartCard title="Export data" subtitle="Download raw data as CSV">
          <div className="grid grid-cols-2 gap-3">
            {exports.map((e) => (
              <Button
                key={e.label}
                variant="outline"
                className="h-11 justify-start"
                disabled={loading}
                onClick={e.run}
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                {e.label}
              </Button>
            ))}
          </div>
        </ChartCard>
      </div>
    </>
  );
}
