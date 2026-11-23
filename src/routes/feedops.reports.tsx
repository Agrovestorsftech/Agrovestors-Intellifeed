import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { ChartCard, ChartSkeleton, Donut, RankBars, SimpleBars } from "@/components/data/Charts";
import { downloadCsv } from "@/components/data/csv";
import { humanize } from "@/components/data/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listInventory, listOrders, listProduction, naira, WAREHOUSES } from "@/lib/ops/api";

export const Route = createFileRoute("/feedops/reports")({
  head: () => ({ meta: [{ title: "FeedOps Reports — IntelliFeed360" }] }),
  component: FeedOpsReportsPage,
});

function weekStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function FeedOpsReportsPage() {
  const [weeks, setWeeks] = useState(8);
  const prod = useQuery({ queryKey: ["ops-production"], queryFn: listProduction });
  const orders = useQuery({ queryKey: ["ops-orders"], queryFn: listOrders });
  const inv = useQuery({ queryKey: ["ops-inventory"], queryFn: listInventory });
  const loading = prod.isLoading || orders.isLoading || inv.isLoading;

  const first = weekStart(new Date());
  first.setDate(first.getDate() - (weeks - 1) * 7);
  const output = Array.from({ length: weeks }, (_, i) => {
    const s = new Date(first);
    s.setDate(first.getDate() + i * 7);
    const e = new Date(s);
    e.setDate(s.getDate() + 7);
    const runs = (prod.data ?? []).filter((r) => r.status === "completed" && r.finished_at && new Date(r.finished_at) >= s && new Date(r.finished_at) < e);
    const ords = (orders.data ?? []).filter((o) => new Date(o.placed_at) >= s && new Date(o.placed_at) < e);
    return {
      week: s.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      mt: Math.round((runs.reduce((t, r) => t + Number(r.quantity), 0) / 1000) * 10) / 10,
      orders: ords.length,
    };
  });

  const statusCounts: Record<string, number> = {};
  for (const o of orders.data ?? []) {
    const k = o.status === "placed" ? "pending" : o.status;
    statusCounts[k] = (statusCounts[k] ?? 0) + 1;
  }
  const byStatus = Object.entries(statusCounts).map(([name, value]) => ({ name: humanize(name), value }));

  const productBags: Record<string, number> = {};
  for (const o of orders.data ?? []) {
    const k = o.feed_products?.name ?? "Other";
    productBags[k] = (productBags[k] ?? 0) + Number(o.quantity);
  }
  const topProducts = Object.entries(productBags)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const valueByWarehouse = WAREHOUSES.map((w) => ({
    name: w,
    value: (inv.data ?? []).filter((r) => r.warehouse === w).reduce((s, r) => s + Number(r.quantity) * Number(r.feed_products?.price_per_unit ?? 0), 0),
  }));

  const exportMenu = (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        className="h-10"
        disabled={loading}
        onClick={() =>
          downloadCsv(
            "production.csv",
            (prod.data ?? []).map((r) => ({ batch: r.batch_no, product: r.feed_products?.name, kg: r.quantity, status: r.status, started_at: r.started_at, finished_at: r.finished_at })),
          )
        }
      >
        <Download className="mr-2 h-4 w-4" aria-hidden="true" />
        Production CSV
      </Button>
      <Button
        variant="outline"
        className="h-10"
        disabled={loading}
        onClick={() =>
          downloadCsv(
            "inventory.csv",
            (inv.data ?? []).map((r) => ({ product: r.feed_products?.name, sku: r.feed_products?.sku, warehouse: r.warehouse, bags: r.quantity, reorder_level: r.reorder_level })),
          )
        }
      >
        <Download className="mr-2 h-4 w-4" aria-hidden="true" />
        Inventory CSV
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Output, demand and stock value at a glance." actions={exportMenu} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Weekly output and orders"
          subtitle="Completed production (MT) vs orders placed"
          action={
            <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
              <SelectTrigger className="h-9 w-[140px] rounded-xl" aria-label="Report period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">Last 4 weeks</SelectItem>
                <SelectItem value="8">Last 8 weeks</SelectItem>
                <SelectItem value="12">Last 12 weeks</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          {loading ? (
            <ChartSkeleton />
          ) : (
            <SimpleBars
              data={output}
              x="week"
              series={[
                { key: "mt", label: "Output (MT)" },
                { key: "orders", label: "Orders" },
              ]}
            />
          )}
        </ChartCard>
        <ChartCard title="Orders by status" subtitle="All orders">
          {loading ? <ChartSkeleton height={220} /> : <Donut data={byStatus} height={180} />}
        </ChartCard>
        <ChartCard title="Most ordered products" subtitle="Bags ordered, all time" className="xl:col-span-2">
          {loading ? <ChartSkeleton height={200} /> : <RankBars rows={topProducts} format={(v) => `${v.toLocaleString()} bags`} />}
        </ChartCard>
        <ChartCard title="Stock value by warehouse" subtitle="At list price">
          {loading ? <ChartSkeleton height={220} /> : <Donut data={valueByWarehouse} height={180} format={naira} />}
        </ChartCard>
      </div>
    </>
  );
}
