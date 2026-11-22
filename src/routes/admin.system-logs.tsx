import { createFileRoute } from "@tanstack/react-router";
import { SampleDataNotice } from "@/components/data/SampleDataNotice";
import { useQuery } from "@tanstack/react-query";
import { AlertOctagon, AlertTriangle, Download, Info, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge, humanize } from "@/components/data/StatusBadge";
import { downloadCsv } from "@/components/data/csv";
import { Button } from "@/components/ui/button";
import { dateTime, listSystemLogs } from "@/lib/ops/api";

export const Route = createFileRoute("/admin/system-logs")({
  head: () => ({ meta: [{ title: "System Logs — IntelliFeed360" }] }),
  component: SystemLogsPage,
});

type Row = Awaited<ReturnType<typeof listSystemLogs>>[number];
const DAY = 86_400_000;

function SystemLogsPage() {
  const q = useQuery({ queryKey: ["admin-logs"], queryFn: listSystemLogs });
  const data = q.data ?? [];
  const today = data.filter((r) => Date.now() - new Date(r.created_at).getTime() < DAY);
  const entities = [...new Set(data.map((r) => r.entity as string))].sort();

  const columns: Column<Row>[] = [
    {
      key: "time",
      header: "Time",
      sort: (r) => r.created_at,
      cell: (r) => (
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {dateTime(r.created_at)}
        </span>
      ),
    },
    {
      key: "level",
      header: "Level",
      sort: (r) => ["info", "warn", "error"].indexOf(r.level ?? "info"),
      cell: (r) => <StatusBadge status={r.level ?? "info"} />,
    },
    {
      key: "message",
      header: "Event",
      sort: (r) => r.action,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate text-foreground">{r.message ?? r.action}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{r.action}</p>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      hideBelow: "md",
      sort: (r) => r.actor_name,
      cell: (r) => r.actor_name ?? "System",
    },
    {
      key: "ip",
      header: "IP",
      hideBelow: "lg",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">{r.meta?.ip ?? "—"}</span>
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
          "system-logs.csv",
          data.map((r) => ({
            time: r.created_at,
            level: r.level,
            action: r.action,
            entity: r.entity,
            message: r.message,
            actor: r.actor_name,
            ip: r.meta?.ip,
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
      <SampleDataNotice what="system logs" />
      <PageHeader
        title="System Logs"
        subtitle="Platform events: sign-ins, data changes, sync and payment errors."
        actions={exportBtn}
      />
      <StatCards
        loading={q.isLoading}
        stats={[
          {
            label: "Events (24h)",
            value: today.length,
            hint: `${data.length} retained`,
            icon: ScrollText,
            tone: "primary",
          },
          {
            label: "Info",
            value: today.filter((r) => (r.level ?? "info") === "info").length,
            hint: "Last 24 hours",
            icon: Info,
            tone: "info",
          },
          {
            label: "Warnings",
            value: today.filter((r) => r.level === "warn").length,
            hint: "Last 24 hours",
            icon: AlertTriangle,
            tone: "warning",
          },
          {
            label: "Errors",
            value: today.filter((r) => r.level === "error").length,
            hint: "Last 24 hours",
            icon: AlertOctagon,
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
          `${r.action} ${r.message ?? ""} ${r.actor_name ?? ""} ${r.meta?.ip ?? ""}`
        }
        searchPlaceholder="Search events, actors or IPs"
        filters={[
          {
            id: "level",
            label: "Levels",
            options: ["info", "warn", "error"].map((v) => ({ value: v, label: humanize(v) })),
            value: (r) => r.level ?? "info",
          },
          {
            id: "entity",
            label: "Areas",
            options: entities.map((v) => ({ value: v, label: humanize(v) })),
            value: (r) => r.entity,
          },
        ]}
        defaultSort={{ key: "time", dir: "desc" }}
        pageSize={15}
        empty={{ title: "No events logged" }}
      />
    </>
  );
}
