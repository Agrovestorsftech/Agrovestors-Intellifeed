import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCheck, Plus, Truck } from "lucide-react";
import { useState } from "react";
import { EditDeliveryDialog, ScheduleDeliveryDialog } from "@/components/feedops/dialogs";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { useAction } from "@/components/data/useAction";
import { Button } from "@/components/ui/button";
import { listDeliveries, setDeliveryStatus, shortDate } from "@/lib/ops/api";

export const Route = createFileRoute("/feedops/deliveries")({
  head: () => ({ meta: [{ title: "Deliveries — IntelliFeed360" }] }),
  component: DeliveriesPage,
});

type Row = Awaited<ReturnType<typeof listDeliveries>>[number];

function DeliveriesPage() {
  const act = useAction();
  const q = useQuery({ queryKey: ["ops-deliveries"], queryFn: listDeliveries });
  const [editing, setEditing] = useState<Row | null>(null);
  const data = q.data ?? [];
  const today = new Date().toDateString();

  const columns: Column<Row>[] = [
    { key: "order", header: "Order", sort: (r) => r.order?.order_no, cell: (r) => <span className="font-medium text-foreground">{r.order?.order_no ?? "—"}</span> },
    {
      key: "farm",
      header: "Destination",
      sort: (r) => r.order?.farmers?.farm_name,
      cell: (r) => (
        <div>
          <p className="text-foreground">{r.order?.farmers?.farm_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.region ?? ""}</p>
        </div>
      ),
    },
    { key: "load", header: "Load", hideBelow: "lg", cell: (r) => (r.order ? `${r.order.quantity} bags · ${r.order.feed_products?.name ?? ""}` : "—") },
    { key: "driver", header: "Driver", hideBelow: "md", sort: (r) => r.driver, cell: (r) => r.driver },
    { key: "vehicle", header: "Vehicle", hideBelow: "lg", cell: (r) => <span className="font-mono text-xs">{r.vehicle}</span> },
    { key: "when", header: "Scheduled", hideBelow: "sm", sort: (r) => r.scheduled_for, cell: (r) => <span className="text-muted-foreground">{shortDate(r.scheduled_for)}</span> },
    { key: "status", header: "Status", sort: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const schedule = (
    <ScheduleDeliveryDialog
      trigger={
        <Button className="h-10">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Schedule delivery
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader title="Deliveries" subtitle="Dispatch confirmed orders and track them to the farm gate." actions={schedule} />
      <StatCards
        loading={q.isLoading}
        stats={[
          { label: "Scheduled", value: data.filter((r) => r.status === "scheduled").length, hint: "Waiting to leave", icon: CalendarClock, tone: "primary" },
          { label: "In transit", value: data.filter((r) => r.status === "in_transit").length, hint: "On the road now", icon: Truck, tone: "info" },
          { label: "Delivered today", value: data.filter((r) => r.status === "delivered" && r.delivered_at && new Date(r.delivered_at).toDateString() === today).length, hint: "Signed for", icon: CheckCheck, tone: "success" },
          { label: "Failed", value: data.filter((r) => r.status === "failed").length, hint: "Needs rescheduling", icon: AlertTriangle, tone: "destructive" },
        ]}
      />
      <DataTable
        rows={data}
        columns={columns}
        getId={(r) => r.id}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchText={(r) => `${r.order?.order_no} ${r.order?.farmers?.farm_name} ${r.driver} ${r.vehicle} ${r.region}`}
        searchPlaceholder="Search order, farm, driver or vehicle"
        filters={[
          {
            id: "status",
            label: "Statuses",
            options: ["scheduled", "in_transit", "delivered", "failed"].map((s) => ({ value: s, label: s.replace("_", " ").replace(/^./, (c) => c.toUpperCase()) })),
            value: (r) => r.status,
          },
        ]}
        defaultSort={{ key: "when", dir: "desc" }}
        rowLabel={(r) => r.order?.order_no ?? "delivery"}
        rowActions={(r) => [
          {
            label: r.status === "failed" ? "Reschedule" : "Edit delivery",
            onSelect: () => setEditing(r),
            disabled: r.status !== "scheduled" && r.status !== "failed",
          },
          { label: "Mark in transit", onSelect: () => act(() => setDeliveryStatus(r, "in_transit"), "Marked in transit"), disabled: r.status !== "scheduled" },
          // Only a delivery on the road can be completed or failed (same rule as the backend).
          { label: "Mark delivered", onSelect: () => act(() => setDeliveryStatus(r, "delivered"), "Delivery completed"), disabled: r.status !== "in_transit" },
          {
            label: "Mark failed",
            onSelect: () => act(() => setDeliveryStatus(r, "failed"), "Delivery marked failed — order returned to processing"),
            disabled: r.status !== "in_transit",
            destructive: true,
            separatorBefore: true,
          },
        ]}
        empty={{ title: "No deliveries yet", hint: "Schedule a confirmed order for delivery.", action: schedule }}
      />
      <EditDeliveryDialog delivery={editing} onOpenChange={(o) => !o && setEditing(null)} />
    </>
  );
}
