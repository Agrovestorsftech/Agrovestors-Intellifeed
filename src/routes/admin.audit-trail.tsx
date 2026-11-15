import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, FilePen, FilePlus2, FileX2, History } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge, humanize } from "@/components/data/StatusBadge";
import { Person } from "@/components/data/Person";
import { downloadCsv } from "@/components/data/csv";
import { Button } from "@/components/ui/button";
import { dateTime, listAuditEvents } from "@/lib/ops/api";

export const Route = createFileRoute("/admin/audit-trail")({
  head: () => ({ meta: [{ title: "Audit Trail — IntelliFeed360" }] }),
  component: AuditTrailPage,
});

type Row = Awaited<ReturnType<typeof listAuditEvents>>[number];
const ACTION_TONE = { created: "success", updated: "info", deleted: "danger" } as const;

function AuditTrailPage() {
  const q = useQuery({ queryKey: ["admin-audit"], queryFn: listAuditEvents });
  const data = q.data ?? [];
  const week = data.filter((r) => Date.now() - new Date(r.created_at).getTime() < 7 * 86_400_000);
  const actors = [...new Set(data.map((r) => r.actor_name as string))].sort();
  const entities = [...new Set(data.map((r) => r.entity as string))].sort();

  const columns: Column<Row>[] = [
    {
      key: "time",
      header: "When",
      sort: (r) => r.created_at,
      cell: (r) => (
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {dateTime(r.created_at)}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Who",
      sort: (r) => r.actor_name,
      cell: (r) => <Person name={r.actor_name} sub={r.ip} />,
    },
    {
      key: "action",
      header: "Action",
      sort: (r) => r.action,
      cell: (r) => (
        <StatusBadge
          status={r.action}
          tone={ACTION_TONE[r.action as keyof typeof ACTION_TONE] ?? "neutral"}
        />
      ),
    },
    {
      key: "target",
      header: "Record",
      sort: (r) => r.target,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate text-foreground">{r.target}</p>
          <p className="truncate text-xs text-muted-foreground">{humanize(r.entity)}</p>
        </div>
      ),
    },
    {
      key: "change",
      header: "Change",
      hideBelow: "md",
      cell: (r) =>
        r.field ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
            <span className="font-medium text-foreground">{humanize(r.field)}:</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground line-through decoration-muted-foreground/50">
              {r.from ?? "—"}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" aria-label="changed to" />
            <span className="rounded bg-primary-soft px-1.5 py-0.5 text-primary">
              {r.to ?? "—"}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  const exportBtn = (
    <Button
      variant="outline"
      className="h-10"
      disabled={q.isLoading || data.length === 0}
      onClick={() =>
        downloadCsv(
          "audit-trail.csv",
          data.map((r) => ({
            time: r.created_at,
            actor: r.actor_name,
            action: r.action,
            entity: r.entity,
            record: r.target,
            field: r.field,
            from: r.from,
            to: r.to,
            ip: r.ip,
          })),
        )
      }
    >
      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
      Export CSV
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Audit Trail"
        subtitle="Who changed what, and when. Every admin action is recorded here."
        actions={exportBtn}
      />
      <StatCards
        loading={q.isLoading}
        stats={[
          {
            label: "Changes (7d)",
            value: week.length,
            hint: `${new Set(week.map((r) => r.actor_name)).size} people`,
            icon: History,
            tone: "primary",
          },
          {
            label: "Created",
            value: week.filter((r) => r.action === "created").length,
            hint: "Last 7 days",
            icon: FilePlus2,
            tone: "success",
          },
          {
            label: "Updated",
            value: week.filter((r) => r.action === "updated").length,
            hint: "Last 7 days",
            icon: FilePen,
            tone: "info",
          },
          {
            label: "Deleted",
            value: week.filter((r) => r.action === "deleted").length,
            hint: "Last 7 days",
            icon: FileX2,
            tone: "destructive",
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
        searchText={(r) =>
          `${r.actor_name} ${r.target} ${r.entity} ${r.field ?? ""} ${r.from ?? ""} ${r.to ?? ""}`
        }
        searchPlaceholder="Search people, records or values"
        filters={[
          {
            id: "actor",
            label: "People",
            options: actors.map((a) => ({ value: a, label: a })),
            value: (r) => r.actor_name,
          },
          {
            id: "action",
            label: "Actions",
            options: ["created", "updated", "deleted"].map((a) => ({
              value: a,
              label: humanize(a),
            })),
            value: (r) => r.action,
          },
          {
            id: "entity",
            label: "Record types",
            options: entities.map((e) => ({ value: e, label: humanize(e) })),
            value: (r) => r.entity,
          },
        ]}
        defaultSort={{ key: "time", dir: "desc" }}
        pageSize={15}
        empty={{ title: "No changes recorded yet" }}
      />
    </>
  );
}
