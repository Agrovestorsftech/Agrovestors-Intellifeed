import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Droplets, FlaskConical, Hourglass, ShieldCheck, ShieldX } from "lucide-react";
import { QualityCheckDialog } from "@/components/feedops/dialogs";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Button } from "@/components/ui/button";
import { dateTime, listQualityChecks, QC_LIMITS } from "@/lib/ops/api";

export const Route = createFileRoute("/feedops/quality-control")({
  head: () => ({ meta: [{ title: "Quality Control — IntelliFeed360" }] }),
  component: QualityPage,
});

type Row = Awaited<ReturnType<typeof listQualityChecks>>[number];

function Metric({ value, limit, unit }: { value: number | null; limit?: number; unit: string }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const bad = limit != null && value > limit;
  return (
    <span className={bad ? "font-medium text-destructive" : ""}>
      {value}
      {unit}
    </span>
  );
}

function QualityPage() {
  const q = useQuery({ queryKey: ["ops-qc"], queryFn: listQualityChecks });
  const [recording, setRecording] = useState<Row | null>(null);
  const data = q.data ?? [];
  const tested = data.filter((r) => r.result !== "pending");
  const passRate = tested.length ? Math.round((tested.filter((r) => r.result === "pass").length / tested.length) * 100) : 0;
  const avgMoisture = tested.length ? tested.reduce((s, r) => s + Number(r.moisture), 0) / tested.length : 0;

  const columns: Column<Row>[] = [
    { key: "batch", header: "Batch", sort: (r) => r.batch_no, cell: (r) => <span className="font-medium text-foreground">{r.batch_no}</span> },
    { key: "product", header: "Product", hideBelow: "sm", sort: (r) => r.feed_products?.name, cell: (r) => r.feed_products?.name ?? "—" },
    { key: "moisture", header: "Moisture", align: "right", sort: (r) => r.moisture, cell: (r) => <Metric value={r.moisture} limit={QC_LIMITS.moisture} unit="%" /> },
    { key: "protein", header: "Protein", align: "right", hideBelow: "md", sort: (r) => r.protein, cell: (r) => <Metric value={r.protein} unit="%" /> },
    { key: "aflatoxin", header: "Aflatoxin", align: "right", hideBelow: "md", sort: (r) => r.aflatoxin, cell: (r) => <Metric value={r.aflatoxin} limit={QC_LIMITS.aflatoxin} unit=" ppb" /> },
    { key: "inspector", header: "Inspector", hideBelow: "lg", sort: (r) => r.inspector, cell: (r) => r.inspector ?? <span className="text-muted-foreground">Unassigned</span> },
    { key: "checked", header: "Checked", hideBelow: "lg", sort: (r) => r.checked_at, cell: (r) => <span className="text-muted-foreground">{dateTime(r.checked_at)}</span> },
    { key: "result", header: "Result", sort: (r) => r.result, cell: (r) => <StatusBadge status={r.result} label={r.result === "pass" ? "Passed" : r.result === "fail" ? "Failed" : "Awaiting test"} /> },
  ];

  const add = (
    <QualityCheckDialog
      trigger={
        <Button className="h-10">
          <FlaskConical className="mr-2 h-4 w-4" aria-hidden="true" />
          Record check
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader title="Quality Control" subtitle="Lab results for every finished batch before it ships." actions={add} />
      <StatCards
        loading={q.isLoading}
        stats={[
          { label: "Pass rate", value: `${passRate}%`, hint: `${tested.length} batches tested`, icon: ShieldCheck, tone: "success" },
          { label: "Awaiting test", value: data.filter((r) => r.result === "pending").length, hint: "Finished batches", icon: Hourglass, tone: "warning" },
          { label: "Failed", value: data.filter((r) => r.result === "fail").length, hint: "On hold", icon: ShieldX, tone: "destructive" },
          { label: "Avg. moisture", value: `${avgMoisture.toFixed(1)}%`, hint: `Limit ${QC_LIMITS.moisture}%`, icon: Droplets, tone: "info" },
        ]}
      />
      <DataTable
        rows={data}
        columns={columns}
        getId={(r) => r.id}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchText={(r) => `${r.batch_no} ${r.feed_products?.name} ${r.inspector ?? ""}`}
        searchPlaceholder="Search batch, product or inspector"
        filters={[
          { id: "result", label: "Results", options: [{ value: "pending", label: "Awaiting test" }, { value: "pass", label: "Passed" }, { value: "fail", label: "Failed" }], value: (r) => r.result },
        ]}
        rowLabel={(r) => r.batch_no}
        rowActions={(r) => [{ label: r.result === "pending" ? "Record results" : "Re-test batch", onSelect: () => setRecording(r) }]}
        empty={{ title: "No quality checks yet", hint: "Completing a production batch queues a check here." }}
      />
      <QualityCheckDialog open={!!recording} onOpenChange={(o) => !o && setRecording(null)} checkId={recording?.id} title={recording ? `Results for ${recording.batch_no}` : undefined} />
    </>
  );
}
