import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Factory, Hourglass, Loader, Plus } from "lucide-react";
import { NewBatchDialog } from "@/components/feedops/dialogs";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { FormDialog } from "@/components/data/FormDialog";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { useAction, useRefresh } from "@/components/data/useAction";
import { Button } from "@/components/ui/button";
import { BAG_KG, cancelBatch, completeBatch, dateTime, IS_API, listProduction, startBatch, useWarehouseOptions } from "@/lib/ops/api";

export const Route = createFileRoute("/feedops/production")({
  head: () => ({ meta: [{ title: "Feed Production — IntelliFeed360" }] }),
  component: ProductionPage,
});

type Row = Awaited<ReturnType<typeof listProduction>>[number];

function ProductionPage() {
  const act = useAction();
  const refresh = useRefresh();
  const q = useQuery({ queryKey: ["ops-production"], queryFn: listProduction });
  const warehouseOptions = useWarehouseOptions();
  const [completing, setCompleting] = useState<Row | null>(null);
  const data = q.data ?? [];

  const weekAgo = Date.now() - 7 * 86_400_000;
  const doneWeek = data.filter((r) => r.status === "completed" && r.finished_at && new Date(r.finished_at).getTime() >= weekAgo);
  const outputMt = doneWeek.reduce((s, r) => s + Number(r.quantity), 0) / 1000;

  const columns: Column<Row>[] = [
    { key: "batch", header: "Batch", sort: (r) => r.batch_no, cell: (r) => <span className="font-medium text-foreground">{r.batch_no}</span> },
    { key: "product", header: "Product", sort: (r) => r.feed_products?.name, cell: (r) => r.feed_products?.name ?? "—" },
    { key: "qty", header: "Quantity", align: "right", sort: (r) => Number(r.quantity), cell: (r) => `${(Number(r.quantity) / 1000).toFixed(1)} MT` },
    { key: "bags", header: "Bags", align: "right", hideBelow: "md", sort: (r) => Number(r.quantity), cell: (r) => Math.round(Number(r.quantity) / BAG_KG).toLocaleString() },
    { key: "status", header: "Status", sort: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    { key: "started", header: "Started", hideBelow: "sm", sort: (r) => r.started_at, cell: (r) => <span className="text-muted-foreground">{dateTime(r.started_at)}</span> },
    { key: "finished", header: "Finished", hideBelow: "lg", sort: (r) => r.finished_at, cell: (r) => <span className="text-muted-foreground">{dateTime(r.finished_at)}</span> },
  ];

  const newBatch = (
    <NewBatchDialog
      trigger={
        <Button className="h-10">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          New batch
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader title="Feed Production" subtitle="Queue, run and complete milling batches." actions={newBatch} />
      <StatCards
        loading={q.isLoading}
        stats={[
          { label: "Queued", value: data.filter((r) => r.status === "queued").length, hint: "Waiting for the mill", icon: Hourglass, tone: "primary" },
          { label: "Running", value: data.filter((r) => r.status === "running").length, hint: "On the line now", icon: Loader, tone: "info" },
          { label: "Completed (7 days)", value: doneWeek.length, hint: "Batches finished", icon: CheckCircle2, tone: "success" },
          { label: "Output (7 days)", value: `${outputMt.toFixed(1)} MT`, hint: "Bagged into inventory", icon: Factory, tone: "warning" },
        ]}
      />
      <DataTable
        rows={data}
        columns={columns}
        getId={(r) => r.id}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchText={(r) => `${r.batch_no} ${r.feed_products?.name}`}
        searchPlaceholder="Search batch or product"
        filters={[
          {
            id: "status",
            label: "Statuses",
            options: ["queued", "running", "completed", "cancelled"].map((s) => ({ value: s, label: s[0]!.toUpperCase() + s.slice(1) })),
            value: (r) => r.status,
          },
        ]}
        rowLabel={(r) => r.batch_no}
        rowActions={(r) => [
          { label: "Start batch", onSelect: () => act(() => startBatch(r.id), `${r.batch_no} started`), disabled: r.status !== "queued" },
          { label: "Complete & bag into stock", onSelect: () => setCompleting(r), disabled: r.status !== "running" },
          { label: "Cancel batch", onSelect: () => act(() => cancelBatch(r.id), `${r.batch_no} cancelled`), disabled: r.status === "completed" || r.status === "cancelled", destructive: true, separatorBefore: true },
        ]}
        empty={{ title: "No batches yet", hint: "Queue a batch to start production.", action: newBatch }}
      />

      <FormDialog
        open={!!completing}
        onOpenChange={(o) => !o && setCompleting(null)}
        title={`Complete ${completing?.batch_no ?? "batch"}`}
        description={
          completing
            ? IS_API
              ? `${Number(completing.bags).toLocaleString()} bags of ${completing.feed_products?.name} go to ${completing.warehouse} once they pass a quality check.`
              : `${Math.round(Number(completing.quantity) / BAG_KG).toLocaleString()} bags of ${completing.feed_products?.name} will be added to stock and a quality check queued.`
            : undefined
        }
        submitLabel="Complete batch"
        successMessage={IS_API ? "Batch completed — record its quality check" : "Batch completed and bagged into stock"}
        fields={IS_API ? [] : [{ name: "warehouse", label: "Store in", type: "select", options: warehouseOptions, required: true }]}
        onSubmit={async (v) => {
          await completeBatch(completing!, v.warehouse);
          await refresh();
        }}
      />
    </>
  );
}
