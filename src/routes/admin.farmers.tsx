import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, HeartPulse, Sprout, UserMinus, Users } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { FormDialog } from "@/components/data/FormDialog";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge, humanize } from "@/components/data/StatusBadge";
import { Person } from "@/components/data/Person";
import { downloadCsv } from "@/components/data/csv";
import { useAction, useRefresh } from "@/components/data/useAction";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { relativeTime } from "@/lib/dashboard/queries";
import { audit, hasPortalRole, IS_API, listFarmers, listUsers, staffNamer, updateRow, useActorName } from "@/lib/ops/api";
import { REGION_OPTIONS } from "@/lib/ops/people";

export const Route = createFileRoute("/admin/farmers")({
  head: () => ({ meta: [{ title: "Farmers — IntelliFeed360" }] }),
  component: AdminFarmersPage,
});

type Row = Awaited<ReturnType<typeof listFarmers>>[number];

const SPECIES = ["poultry", "cattle", "goats", "pigs", "fish", "sheep"];

function AdminFarmersPage() {
  const act = useAction();
  const refresh = useRefresh();
  const actor = useActorName();
  const me = useAuth().session?.user;
  const q = useQuery({ queryKey: ["admin-farmers"], queryFn: listFarmers });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const [editing, setEditing] = useState<Row | null>(null);
  const data = q.data ?? [];
  const agentName = staffNamer(users.data ?? [], me);
  const agentOptions = (users.data ?? [])
    .filter((u) => hasPortalRole(u, "field_agent") && u.status === "active")
    .map((u) => ({ value: u.id as string, label: `${u.name} · ${u.region}` }));
  const openCases = (r: Row) =>
    (r.health_cases ?? []).filter((c: Row) => c.status !== "resolved").length;

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Farmer",
      sort: (r) => r.name,
      cell: (r) => <Person name={r.name} sub={r.farm_name} />,
    },
    {
      key: "species",
      header: "Livestock",
      hideBelow: "md",
      sort: (r) => r.livestock_type,
      cell: (r) => humanize(r.livestock_type ?? "—"),
    },
    {
      key: "region",
      header: "Region",
      hideBelow: "sm",
      sort: (r) => r.region,
      cell: (r) => r.region,
    },
    {
      key: "agent",
      header: "Field agent",
      hideBelow: "lg",
      sort: (r) => agentName(r.assigned_agent_id),
      cell: (r) => agentName(r.assigned_agent_id),
    },
    {
      key: "visits",
      header: "Visits",
      align: "right",
      hideBelow: "lg",
      sort: (r) => r.visit_reports?.length ?? 0,
      cell: (r) => r.visit_reports?.length ?? 0,
    },
    {
      key: "cases",
      header: "Open cases",
      align: "right",
      sort: openCases,
      cell: (r) =>
        openCases(r) > 0 ? (
          <StatusBadge status="open" label={String(openCases(r))} />
        ) : (
          <span className="text-muted-foreground">0</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sort: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const exportBtn = (
    <Button
      variant="outline"
      className="h-10"
      disabled={q.isLoading || data.length === 0}
      onClick={() =>
        downloadCsv(
          "farmers.csv",
          data.map((r) => ({
            name: r.name,
            farm: r.farm_name,
            region: r.region,
            livestock: r.livestock_type,
            phone: r.phone,
            agent: agentName(r.assigned_agent_id),
            visits: r.visit_reports?.length ?? 0,
            open_cases: openCases(r),
            status: r.status,
          })),
        )
      }
    >
      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
      Export CSV
    </Button>
  );

  const unassigned = data.filter((r) => !r.assigned_agent_id).length;

  return (
    <>
      <PageHeader
        title="Farmers"
        subtitle="Every farmer on the platform, their agent and their health status."
        actions={exportBtn}
      />
      <StatCards
        loading={q.isLoading}
        stats={[
          {
            label: "Total farmers",
            value: data.length,
            hint: `${new Set(data.map((r) => r.region)).size} regions`,
            icon: Users,
            tone: "primary",
          },
          {
            label: "Active",
            value: data.filter((r) => r.status === "active").length,
            hint: "Receiving visits",
            icon: Sprout,
            tone: "success",
          },
          {
            label: "With open cases",
            value: data.filter((r) => openCases(r) > 0).length,
            hint: "Need vet follow-up",
            icon: HeartPulse,
            tone: "warning",
          },
          {
            label: "Inactive",
            value: data.filter((r) => r.status !== "active").length,
            hint: unassigned ? `${unassigned} unassigned` : "All assigned",
            icon: UserMinus,
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
        searchText={(r) => `${r.name} ${r.farm_name} ${r.region} ${r.phone}`}
        searchPlaceholder="Search farmer, farm, region or phone"
        filters={[
          {
            id: "region",
            label: "Regions",
            options: REGION_OPTIONS.filter((o) => o.value !== "HQ"),
            value: (r) => r.region,
          },
          {
            id: "species",
            label: "Livestock",
            options: SPECIES.map((s) => ({ value: s, label: humanize(s) })),
            value: (r) => r.livestock_type,
          },
          {
            id: "status",
            label: "Statuses",
            options: ["active", "inactive"].map((s) => ({ value: s, label: humanize(s) })),
            value: (r) => r.status,
          },
        ]}
        defaultSort={{ key: "name", dir: "asc" }}
        rowLabel={(r) => r.name}
        rowActions={(r) => [
          { label: "Reassign agent / region", onSelect: () => setEditing(r) },
          r.status === "active"
            ? {
                label: "Deactivate",
                destructive: true,
                separatorBefore: true,
                onSelect: () =>
                  act(async () => {
                    await updateRow("farmers", r.id, {
                      status: "inactive",
                      updated_at: new Date().toISOString(),
                    });
                    await audit(actor, "updated", "farmer", r.name, {
                      field: "status",
                      from: "active",
                      to: "inactive",
                    });
                  }, `${r.name} deactivated`),
              }
            : {
                label: "Reactivate",
                separatorBefore: true,
                onSelect: () =>
                  act(async () => {
                    await updateRow("farmers", r.id, {
                      status: "active",
                      updated_at: new Date().toISOString(),
                    });
                    await audit(actor, "updated", "farmer", r.name, {
                      field: "status",
                      from: r.status,
                      to: "active",
                    });
                  }, `${r.name} reactivated`),
              },
        ]}
        empty={{
          title: "No farmers yet",
          hint: "Field agents register farmers from the mobile app or the Field Agent dashboard.",
        }}
      />
      <FormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`Reassign ${editing?.name ?? "farmer"}`}
        description={editing ? `Last updated ${relativeTime(editing.updated_at)}.` : undefined}
        submitLabel="Save"
        successMessage="Farmer updated"
        initialValues={
          editing ? { agent: editing.assigned_agent_id ?? "", region: editing.region } : undefined
        }
        fields={[
          {
            name: "agent",
            label: "Field agent",
            type: "select",
            options: agentOptions,
            required: true,
            full: true,
          },
          // The backend has no farmer region; a farm's state comes from the farmer app.
          ...(IS_API ? [] : [{
            name: "region",
            label: "Region",
            type: "select" as const,
            options: REGION_OPTIONS.filter((o) => o.value !== "HQ"),
            required: true,
            full: true,
          }]),
        ]}
        onSubmit={async (v) => {
          const r = editing!;
          await updateRow("farmers", r.id, {
            assigned_agent_id: v.agent,
            region: v.region,
            updated_at: new Date().toISOString(),
          });
          if (v.agent !== r.assigned_agent_id)
            await audit(actor, "updated", "farmer", r.name, {
              field: "agent",
              from: agentName(r.assigned_agent_id),
              to: agentName(v.agent),
            });
          if (v.region !== r.region)
            await audit(actor, "updated", "farmer", r.name, {
              field: "region",
              from: r.region,
              to: v.region,
            });
          await refresh();
        }}
      />
    </>
  );
}
