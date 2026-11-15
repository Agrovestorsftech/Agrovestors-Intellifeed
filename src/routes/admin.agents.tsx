import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, HeartPulse, Stethoscope, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Person } from "@/components/data/Person";
import { useAction } from "@/components/data/useAction";
import { InviteUserDialog } from "@/components/admin/dialogs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { relativeTime } from "@/lib/dashboard/queries";
import {
  audit,
  listFarmers,
  listHealthCases,
  listNutritionPlans,
  listUsers,
  listVisits,
  updateRow,
  useActorName,
} from "@/lib/ops/api";
import { REGION_OPTIONS } from "@/lib/ops/people";

export const Route = createFileRoute("/admin/agents")({
  head: () => ({ meta: [{ title: "Agents — IntelliFeed360" }] }),
  component: AgentsPage,
});

type Row = Record<string, any>;
const MONTH_MS = 30 * 86_400_000;

function AgentsPage() {
  const act = useAction();
  const actor = useActorName();
  const [tab, setTab] = useState("field");
  const users = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const farmers = useQuery({ queryKey: ["admin-farmers"], queryFn: listFarmers });
  const visits = useQuery({ queryKey: ["admin-visits"], queryFn: listVisits });
  const cases = useQuery({ queryKey: ["admin-cases"], queryFn: listHealthCases });
  const plans = useQuery({ queryKey: ["admin-plans"], queryFn: listNutritionPlans });
  const loading =
    users.isLoading || farmers.isLoading || visits.isLoading || cases.isLoading || plans.isLoading;
  const error = users.error ?? farmers.error ?? visits.error ?? cases.error ?? plans.error;
  const retry = () => [users, farmers, visits, cases, plans].forEach((x) => x.refetch());

  const since = Date.now() - MONTH_MS;
  const field: Row[] = (users.data ?? [])
    .filter((u) => u.role === "field_agent")
    .map((u) => {
      const mine = (visits.data ?? []).filter((v) => v.agent_id === u.id);
      return {
        ...u,
        farmers: (farmers.data ?? []).filter((f) => f.assigned_agent_id === u.id).length,
        visits30: mine.filter((v) => new Date(v.submitted_at).getTime() >= since).length,
        pending: mine.filter((v) => v.status === "pending" || v.status === "under_review").length,
      };
    });
  const clinical: Row[] = (users.data ?? [])
    .filter((u) => u.role === "admin_agent")
    .map((u) => {
      const mine = (cases.data ?? []).filter((c) => c.assigned_to === u.name);
      return {
        ...u,
        openCases: mine.filter((c) => c.status !== "resolved").length,
        critical: mine.filter(
          (c) => c.status !== "resolved" && (c.severity === "critical" || c.severity === "high"),
        ).length,
        activePlans: (plans.data ?? []).filter(
          (p) => p.assigned_to === u.name && p.status === "active",
        ).length,
      };
    });

  const setStatus = (r: Row, status: string, verb: string) =>
    act(async () => {
      await updateRow("users", r.id, { status });
      await audit(actor, "updated", "user", r.name, {
        field: "status",
        from: r.status,
        to: status,
      });
    }, `${r.name} ${verb}`);

  const actions = (r: Row) => [
    r.status === "suspended"
      ? { label: "Reactivate", onSelect: () => setStatus(r, "active", "reactivated") }
      : {
          label: "Suspend access",
          destructive: true,
          disabled: r.status === "invited",
          onSelect: () => setStatus(r, "suspended", "suspended"),
        },
  ];

  const common: Column<Row>[] = [
    {
      key: "name",
      header: "Agent",
      sort: (r) => r.name,
      cell: (r) => <Person name={r.name} sub={r.email} />,
    },
    {
      key: "region",
      header: "Region",
      hideBelow: "md",
      sort: (r) => r.region,
      cell: (r) => r.region,
    },
  ];
  const tail: Column<Row>[] = [
    {
      key: "last",
      header: "Last active",
      hideBelow: "lg",
      sort: (r) => r.last_active_at,
      cell: (r) => (
        <span className="text-muted-foreground">
          {r.last_active_at ? relativeTime(r.last_active_at) : "Never"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sort: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];
  const fieldCols: Column<Row>[] = [
    ...common,
    {
      key: "farmers",
      header: "Farmers",
      align: "right",
      sort: (r) => r.farmers,
      cell: (r) => r.farmers,
    },
    {
      key: "visits30",
      header: "Visits (30d)",
      align: "right",
      hideBelow: "sm",
      sort: (r) => r.visits30,
      cell: (r) => r.visits30,
    },
    {
      key: "pending",
      header: "Awaiting review",
      align: "right",
      hideBelow: "md",
      sort: (r) => r.pending,
      cell: (r) => r.pending,
    },
    ...tail,
  ];
  const clinicalCols: Column<Row>[] = [
    ...common,
    {
      key: "openCases",
      header: "Open cases",
      align: "right",
      sort: (r) => r.openCases,
      cell: (r) => r.openCases,
    },
    {
      key: "critical",
      header: "High / critical",
      align: "right",
      hideBelow: "sm",
      sort: (r) => r.critical,
      cell: (r) =>
        r.critical > 0 ? (
          <StatusBadge status="high" label={String(r.critical)} />
        ) : (
          <span className="text-muted-foreground">0</span>
        ),
    },
    {
      key: "plans",
      header: "Active plans",
      align: "right",
      hideBelow: "md",
      sort: (r) => r.activePlans,
      cell: (r) => r.activePlans,
    },
    ...tail,
  ];

  const invite = (
    <InviteUserDialog
      key={tab}
      title={tab === "field" ? "Invite field agent" : "Invite admin agent"}
      defaultRole={tab === "field" ? "field_agent" : "admin_agent"}
      trigger={
        <Button className="h-10">
          <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          Invite agent
        </Button>
      }
    />
  );

  const unassigned = (farmers.data ?? []).filter(
    (f) => !(users.data ?? []).some((u) => u.id === f.assigned_agent_id && u.status === "active"),
  ).length;
  const regionFilter = {
    id: "region",
    label: "Regions",
    options: REGION_OPTIONS,
    value: (r: Row) => r.region,
  };
  const statusFilter = {
    id: "status",
    label: "Statuses",
    options: ["active", "invited", "suspended"].map((s) => ({
      value: s,
      label: s[0]!.toUpperCase() + s.slice(1),
    })),
    value: (r: Row) => r.status,
  };

  return (
    <>
      <PageHeader
        title="Agents"
        subtitle="Field agents and admin agents (nutritionists & vets), with their workload."
        actions={invite}
      />
      <StatCards
        loading={loading}
        stats={[
          {
            label: "Field agents",
            value: field.filter((r) => r.status === "active").length,
            hint: `${field.length} total`,
            icon: Users,
            tone: "primary",
          },
          {
            label: "Admin agents",
            value: clinical.filter((r) => r.status === "active").length,
            hint: "Nutrition & vet",
            icon: Stethoscope,
            tone: "info",
          },
          {
            label: "Reports awaiting review",
            value: field.reduce((s, r) => s + r.pending, 0),
            hint: "Across all agents",
            icon: ClipboardCheck,
            tone: "warning",
          },
          {
            label: "Farmers without active agent",
            value: unassigned,
            hint: "Reassign from Farmers",
            icon: HeartPulse,
            tone: unassigned ? "destructive" : "success",
          },
        ]}
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="field">Field agents</TabsTrigger>
          <TabsTrigger value="clinical">Admin agents</TabsTrigger>
        </TabsList>
        <TabsContent value="field">
          <DataTable
            rows={field}
            columns={fieldCols}
            getId={(r) => r.id}
            loading={loading}
            error={error}
            onRetry={retry}
            searchText={(r) => `${r.name} ${r.email} ${r.region}`}
            searchPlaceholder="Search name, email or region"
            filters={[regionFilter, statusFilter]}
            defaultSort={{ key: "farmers", dir: "desc" }}
            rowLabel={(r) => r.name}
            rowActions={actions}
            empty={{ title: "No field agents yet", action: invite }}
          />
        </TabsContent>
        <TabsContent value="clinical">
          <DataTable
            rows={clinical}
            columns={clinicalCols}
            getId={(r) => r.id}
            loading={loading}
            error={error}
            onRetry={retry}
            searchText={(r) => `${r.name} ${r.email}`}
            searchPlaceholder="Search name or email"
            filters={[statusFilter]}
            defaultSort={{ key: "openCases", dir: "desc" }}
            rowLabel={(r) => r.name}
            rowActions={actions}
            empty={{ title: "No admin agents yet", action: invite }}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
