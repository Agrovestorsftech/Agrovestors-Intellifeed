import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCheck, ClipboardList, Repeat, Truck } from "lucide-react";
import { NewTransferDialog } from "@/components/feedops/dialogs";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { useAction } from "@/components/data/useAction";
import { Button } from "@/components/ui/button";
import { cancelTransfer, dateTime, dispatchTransfer, listTransfers, receiveTransfer } from "@/lib/ops/api";

export const Route = createFileRoute("/feedops/stock-transfers")({
  head: () => ({ meta: [{ title: "Stock Transfers — IntelliFeed360" }] }),
  component: TransfersPage,
});

type Row = Awaited<ReturnType<typeof listTransfers>>[number];

function TransfersPage() {
  const act = useAction();
  const q = useQuery({ queryKey: ["ops-transfers"], queryFn: listTransfers });
  const data = q.data ?? [];
  const monthAgo = Date.now() - 30 * 86_400_000;

  const columns: Column<Row>[] = [
    { key: "ref", header: "Reference", sort: (r) => r.ref, cell: (r) => <span className="font-medium text-foreground">{r.ref}</span> },
    { key: "product", header: "Product", sort: (r) => r.feed_products?.name, cell: (r) => r.feed_products?.name ?? "—" },
    {
      key: "route",
      header: "Route",
      hideBelow: "md",
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {r.from_warehouse}
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="to" />
          {r.to_warehouse}
        </span>
      ),
    },
    { key: "qty", header: "Bags", align: "right", sort: (r) => Number(r.quantity), cell: (r) => Number(r.quantity).toLocaleString() },
    { key: "by", header: "Requested by", hideBelow: "lg", sort: (r) => r.requested_by, cell: (r) => r.requested_by },
    { key: "when", header: "Requested", hideBelow: "sm", sort: (r) => r.requested_at, cell: (r) => <span className="text-muted-foreground">{dateTime(r.requested_at)}</span> },
    { key: "status", header: "Status", sort: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const add = (
    <NewTransferDialog
      trigger={
        <Button className="h-10">
          <Repeat className="mr-2 h-4 w-4" aria-hidden="true" />
          New transfer
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader title="Stock Transfers" subtitle="Move stock between warehouses to cover shortages." actions={add} />
      <StatCards
        loading={q.isLoading}
        stats={[
          { label: "Requested", value: data.filter((r) => r.status === "requested").length, hint: "Waiting to dispatch", icon: ClipboardList, tone: "primary" },
          { label: "In transit", value: data.filter((r) => r.status === "in_transit").length, hint: "Between warehouses", icon: Truck, tone: "info" },
          { label: "Received (30 days)", value: data.filter((r) => r.status === "received" && new Date(r.requested_at).getTime() >= monthAgo).length, hint: "Completed transfers", icon: CheckCheck, tone: "success" },
          {
            label: "Bags moved (30 days)",
            value: data.filter((r) => r.status === "received" && new Date(r.requested_at).getTime() >= monthAgo).reduce((s, r) => s + Number(r.quantity), 0).toLocaleString(),
            hint: "Received only",
            icon: Repeat,
            tone: "warning",
          },
        ]}
      />
      <DataTable
        rows={data}
        columns={columns}
        getId={(r) => r.id}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchText={(r) => `${r.ref} ${r.feed_products?.name} ${r.from_warehouse} ${r.to_warehouse} ${r.requested_by}`}
        searchPlaceholder="Search reference, product or warehouse"
        filters={[
          {
            id: "status",
            label: "Statuses",
            options: ["requested", "in_transit", "received", "cancelled"].map((s) => ({ value: s, label: s.replace("_", " ").replace(/^./, (c) => c.toUpperCase()) })),
            value: (r) => r.status,
          },
        ]}
        rowLabel={(r) => r.ref}
        rowActions={(r) => [
          { label: "Dispatch", onSelect: () => act(() => dispatchTransfer(r), `${r.ref} dispatched`), disabled: r.status !== "requested" },
          { label: "Mark received", onSelect: () => act(() => receiveTransfer(r), `${r.ref} received into ${r.to_warehouse}`), disabled: r.status !== "in_transit" },
          { label: "Cancel transfer", onSelect: () => act(() => cancelTransfer(r.id), `${r.ref} cancelled`), disabled: r.status !== "requested", destructive: true, separatorBefore: true },
        ]}
        empty={{ title: "No transfers yet", hint: "Move stock between warehouses to cover shortages.", action: add }}
      />
    </>
  );
}
