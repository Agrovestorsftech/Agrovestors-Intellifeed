import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCheck, ClipboardList, Loader, Truck } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { useAction } from "@/components/data/useAction";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/components/data/csv";
import { dateTime, IS_API, listDeliveries, listOrders, naira, setOrderStatus } from "@/lib/ops/api";
import { ConfirmOrderDialog, ScheduleDeliveryDialog } from "@/components/feedops/dialogs";

export const Route = createFileRoute("/feedops/orders")({
  head: () => ({ meta: [{ title: "Orders & Fulfillment — IntelliFeed360" }] }),
  component: OrdersPage,
});

type Row = Awaited<ReturnType<typeof listOrders>>[number];

const STATUS_LABEL: Record<string, string> = {
  placed: "New",
  pending: "New",
  processing: "Processing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function OrdersPage() {
  const act = useAction();
  const q = useQuery({ queryKey: ["ops-orders"], queryFn: listOrders });
  const deliveries = useQuery({ queryKey: ["ops-deliveries"], queryFn: listDeliveries });
  const hasDelivery = new Set((deliveries.data ?? []).map((d) => d.order?.id).filter(Boolean));
  const [delivering, setDelivering] = useState<Row | null>(null);
  const [confirming, setConfirming] = useState<Row | null>(null);
  const data = q.data ?? [];
  const isNew = (r: Row) => r.status === "placed" || r.status === "pending";
  const weekAgo = Date.now() - 7 * 86_400_000;

  const value = (r: Row) => Number(r.quantity) * Number(r.feed_products?.price_per_unit ?? 0);
  const columns: Column<Row>[] = [
    { key: "order", header: "Order", sort: (r) => r.order_no, cell: (r) => <span className="font-medium text-foreground">{r.order_no}</span> },
    {
      key: "farm",
      header: "Farm",
      sort: (r) => r.farmers?.farm_name,
      cell: (r) => (
        <div>
          <p className="text-foreground">{r.farmers?.farm_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.farmers?.region ?? ""}</p>
        </div>
      ),
    },
    { key: "product", header: "Product", hideBelow: "md", sort: (r) => r.feed_products?.name, cell: (r) => r.feed_products?.name ?? "—" },
    { key: "qty", header: "Qty", align: "right", sort: (r) => Number(r.quantity), cell: (r) => `${r.quantity} bags` },
    { key: "value", header: "Value", align: "right", hideBelow: "lg", sort: value, cell: (r) => naira(value(r)) },
    { key: "status", header: "Status", sort: (r) => r.status, cell: (r) => <StatusBadge status={r.status === "placed" ? "pending" : r.status} label={STATUS_LABEL[r.status]} /> },
    { key: "placed", header: "Placed", hideBelow: "sm", sort: (r) => r.placed_at, cell: (r) => <span className="text-muted-foreground">{dateTime(r.placed_at)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Orders & Fulfillment"
        subtitle="Confirm orders from the field, then schedule them for delivery."
        actions={
          <Button
            variant="outline"
            className="h-10"
            disabled={!data.length}
            onClick={() =>
              downloadCsv(
                "orders.csv",
                data.map((r) => ({ order: r.order_no, farm: r.farmers?.farm_name, region: r.farmers?.region, product: r.feed_products?.name, bags: r.quantity, value: value(r), status: r.status, placed_at: r.placed_at })),
              )
            }
          >
            Export CSV
          </Button>
        }
      />
      <StatCards
        loading={q.isLoading}
        stats={[
          { label: "New orders", value: data.filter(isNew).length, hint: "Waiting to be confirmed", icon: ClipboardList, tone: "warning" },
          { label: "Processing", value: data.filter((r) => r.status === "processing").length, hint: "Being picked & packed", icon: Loader, tone: "info" },
          { label: "Out for delivery", value: data.filter((r) => r.status === "out_for_delivery").length, hint: "On the road", icon: Truck, tone: "primary" },
          { label: "Delivered (7 days)", value: data.filter((r) => r.status === "delivered" && new Date(r.placed_at).getTime() >= weekAgo).length, hint: "Completed orders", icon: CheckCheck, tone: "success" },
        ]}
      />
      <DataTable
        rows={data}
        columns={columns}
        getId={(r) => r.id}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchText={(r) => `${r.order_no} ${r.farmers?.farm_name} ${r.farmers?.name} ${r.feed_products?.name}`}
        searchPlaceholder="Search order, farm or product"
        filters={[
          {
            id: "status",
            label: "Statuses",
            options: [
              { value: "new", label: "New" },
              { value: "processing", label: "Processing" },
              { value: "out_for_delivery", label: "Out for delivery" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ],
            value: (r) => (isNew(r) ? "new" : r.status),
          },
        ]}
        rowLabel={(r) => r.order_no}
        rowActions={(r) => [
          {
            label: "Confirm order",
            // api mode: confirming sets prices, so it opens the pricing form.
            onSelect: () => (IS_API ? setConfirming(r) : act(() => setOrderStatus(r.id, "processing"), `${r.order_no} confirmed`)),
            disabled: !isNew(r),
          },
          {
            label: hasDelivery.has(r.id) ? "Delivery scheduled" : "Schedule delivery",
            onSelect: () => setDelivering(r),
            disabled: r.status !== "processing" || hasDelivery.has(r.id),
          },
          { label: "Mark delivered", onSelect: () => act(() => setOrderStatus(r.id, "delivered"), `${r.order_no} delivered`), disabled: r.status !== "out_for_delivery" },
          {
            label: "Cancel order",
            onSelect: () => act(() => setOrderStatus(r.id, "cancelled"), `${r.order_no} cancelled`),
            disabled: r.status === "delivered" || r.status === "cancelled",
            destructive: true,
            separatorBefore: true,
          },
        ]}
        empty={{ title: "No orders yet", hint: "Orders placed by field agents appear here." }}
      />
      <ScheduleDeliveryDialog open={!!delivering} onOpenChange={(o) => !o && setDelivering(null)} presetOrderId={delivering?.id} />
      <ConfirmOrderDialog order={confirming} onOpenChange={(o) => !o && setConfirming(null)} />
    </>
  );
}
