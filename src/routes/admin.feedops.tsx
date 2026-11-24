import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Factory, PackageX, ShoppingCart, Truck } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { ChartCard, ChartSkeleton, Donut, RankBars } from "@/components/data/Charts";
import {
  listDeliveries,
  listInventory,
  listOrders,
  listProduction,
  naira,
  shortDate,
  stockStatus,
  useWarehouses,
} from "@/lib/ops/api";
import { relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/admin/feedops")({
  head: () => ({ meta: [{ title: "FeedOps Oversight — IntelliFeed360" }] }),
  component: AdminFeedOpsPage,
});

type Row = Record<string, any>;
const OPEN_ORDER = ["placed", "pending", "processing"];

function AdminFeedOpsPage() {
  const WAREHOUSES = useWarehouses();
  const inv = useQuery({ queryKey: ["ops-inventory"], queryFn: listInventory });
  const orders = useQuery({ queryKey: ["ops-orders"], queryFn: listOrders });
  const prod = useQuery({ queryKey: ["ops-production"], queryFn: listProduction });
  const dl = useQuery({ queryKey: ["ops-deliveries"], queryFn: listDeliveries });
  const loading = inv.isLoading || orders.isLoading || prod.isLoading || dl.isLoading;
  const error = inv.error ?? orders.error ?? prod.error ?? dl.error;

  const lowStock = (inv.data ?? [])
    .filter((r) => stockStatus(r) !== "in_stock")
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));
  const openOrders = (orders.data ?? []).filter((o) => OPEN_ORDER.includes(o.status));
  const running = (prod.data ?? []).filter((r) => r.status === "running" || r.status === "queued");
  const enRoute = (dl.data ?? []).filter(
    (d) => d.status === "scheduled" || d.status === "in_transit",
  );
  // The backend has no list prices yet; with none set, chart bags instead of ₦0.
  const priced = (inv.data ?? []).some((r) => Number(r.feed_products?.price_per_unit ?? 0) > 0);
  const stockValue = WAREHOUSES.map((w) => ({
    name: w,
    value: (inv.data ?? [])
      .filter((r) => r.warehouse === w)
      .reduce((s, r) => s + Number(r.quantity) * (priced ? Number(r.feed_products?.price_per_unit ?? 0) : 1), 0),
  }));
  const orderValue = openOrders.reduce(
    (s, o) => s + Number(o.quantity) * Number(o.feed_products?.price_per_unit ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="FeedOps Oversight"
        subtitle="Read-only view of production, stock and fulfilment. The FeedOps team acts on these from their dashboard."
      />
      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-border bg-card p-6 text-sm text-foreground"
        >
          Couldn't load feed operations data.{" "}
          <button
            className="font-medium text-primary underline"
            onClick={() => [inv, orders, prod, dl].forEach((x) => x.refetch())}
          >
            Try again
          </button>
        </div>
      ) : null}
      <StatCards
        loading={loading}
        stats={[
          {
            label: "Open orders",
            value: openOrders.length,
            hint: `${naira(orderValue)} in value`,
            icon: ShoppingCart,
            tone: "primary",
          },
          {
            label: "Batches in production",
            value: running.length,
            hint: `${running.filter((r) => r.status === "running").length} running now`,
            icon: Factory,
            tone: "info",
          },
          {
            label: "Deliveries en route",
            value: enRoute.length,
            hint: "Scheduled or in transit",
            icon: Truck,
            tone: "success",
          },
          {
            label: "Low / out of stock",
            value: lowStock.length,
            hint: `${lowStock.filter((r) => stockStatus(r) === "out_of_stock").length} out of stock`,
            icon: PackageX,
            tone: lowStock.length ? "destructive" : "success",
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title={priced ? "Stock value by warehouse" : "Stock by warehouse"} subtitle={priced ? undefined : "Bags on hand"}>
          {loading ? (
            <ChartSkeleton height={200} />
          ) : (
            <Donut data={stockValue} format={priced ? naira : (v) => `${v.toLocaleString()} bags`} height={200} />
          )}
        </ChartCard>
        <ChartCard title="Stock needing reorder" subtitle="Bags on hand, lowest first">
          {loading ? (
            <ChartSkeleton height={200} />
          ) : (
            <RankBars
              rows={lowStock
                .slice(0, 6)
                .map((r) => ({
                  name: `${r.feed_products?.name ?? "Product"} · ${r.warehouse}`,
                  value: Number(r.quantity),
                }))}
              format={(v) => `${v} bags`}
              empty="All products are above their reorder level."
            />
          )}
        </ChartCard>

        <ListCard
          title="Production queue"
          loading={loading}
          rows={running}
          empty="No batches queued."
          render={(r) => (
            <>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {r.batch_no} · {r.feed_products?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(Number(r.quantity) / 1000).toFixed(1)} t ·{" "}
                  {r.started_at ? `started ${relativeTime(r.started_at)}` : "not started"}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </>
          )}
        />
        <ListCard
          title="Orders awaiting fulfilment"
          loading={loading}
          rows={openOrders.slice(0, 8)}
          empty="Every order has been dispatched."
          render={(o) => (
            <>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {o.order_no} · {o.farmers?.name ?? "Farmer"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {o.quantity} × {o.feed_products?.name} · {shortDate(o.placed_at)}
                </p>
              </div>
              <StatusBadge status={o.status === "placed" ? "pending" : o.status} />
            </>
          )}
        />
      </div>
    </>
  );
}

function ListCard({
  title,
  rows,
  loading,
  empty,
  render,
}: {
  title: string;
  rows: Row[];
  loading: boolean;
  empty: string;
  render: (r: Row) => ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-foreground">{title}</h2>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-12 rounded-xl bg-muted motion-safe:animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              {render(r)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
