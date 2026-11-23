import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MailPlus, UserCheck, UserPlus, Users, UserX } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { FormDialog } from "@/components/data/FormDialog";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Person } from "@/components/data/Person";
import { useAction, useRefresh } from "@/components/data/useAction";
import { InviteUserDialog } from "@/components/admin/dialogs";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/dashboard/queries";
import { audit, deleteRow, listRoles, listUsers, updateRow, useActorName } from "@/lib/ops/api";
import { REGION_OPTIONS, roleLabel } from "@/lib/ops/people";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Management — IntelliFeed360" }] }),
  component: UsersPage,
});

type Row = Awaited<ReturnType<typeof listUsers>>[number];

function UsersPage() {
  const act = useAction();
  const refresh = useRefresh();
  const actor = useActorName();
  const q = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const roles = useQuery({ queryKey: ["admin-roles"], queryFn: listRoles });
  const [editing, setEditing] = useState<Row | null>(null);
  const data = q.data ?? [];
  const roleList = (roles.data ?? []) as { key: string; name: string }[];
  const roleOptions = roleList.map((r) => ({ value: r.key, label: r.name }));

  const columns: Column<Row>[] = [
    { key: "name", header: "User", sort: (r) => r.name, cell: (r) => <Person name={r.name} sub={r.email} /> },
    { key: "role", header: "Role", sort: (r) => roleLabel(r.role, roleList), cell: (r) => roleLabel(r.role, roleList) },
    { key: "region", header: "Region", hideBelow: "md", sort: (r) => r.region, cell: (r) => r.region },
    { key: "last", header: "Last active", hideBelow: "lg", sort: (r) => r.last_active_at, cell: (r) => <span className="text-muted-foreground">{r.last_active_at ? relativeTime(r.last_active_at) : "Never"}</span> },
    { key: "status", header: "Status", sort: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const invite = (
    <InviteUserDialog
      trigger={
        <Button className="h-10">
          <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          Invite user
        </Button>
      }
    />
  );

  const setStatus = (r: Row, status: string, verb: string) =>
    act(async () => {
      await updateRow("users", r.id, { status });
      await audit(actor, "updated", "user", r.name, { field: "status", from: r.status, to: status });
    }, `${r.name} ${verb}`);

  return (
    <>
      <PageHeader title="User Management" subtitle="Everyone with access to IntelliFeed360." actions={invite} />
      <StatCards
        loading={q.isLoading}
        stats={[
          { label: "Total users", value: data.length, hint: `${roleList.length} roles`, icon: Users, tone: "primary" },
          { label: "Active", value: data.filter((r) => r.status === "active").length, hint: "Can sign in", icon: UserCheck, tone: "success" },
          { label: "Invited", value: data.filter((r) => r.status === "invited").length, hint: "Haven't accepted yet", icon: MailPlus, tone: "info" },
          { label: "Suspended", value: data.filter((r) => r.status === "suspended").length, hint: "Access blocked", icon: UserX, tone: "destructive" },
        ]}
      />
      <DataTable
        rows={data}
        columns={columns}
        getId={(r) => r.id}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchText={(r) => `${r.name} ${r.email} ${r.region}`}
        searchPlaceholder="Search name, email or region"
        filters={[
          { id: "role", label: "Roles", options: roleOptions, value: (r) => r.role },
          { id: "status", label: "Statuses", options: ["active", "invited", "suspended"].map((s) => ({ value: s, label: s[0]!.toUpperCase() + s.slice(1) })), value: (r) => r.status },
        ]}
        defaultSort={{ key: "name", dir: "asc" }}
        rowLabel={(r) => r.name}
        rowActions={(r) => [
          { label: "Edit role & region", onSelect: () => setEditing(r) },
          ...(r.status === "invited" ? [{ label: "Resend invite", onSelect: () => act(async () => undefined, `Invite resent to ${r.email}`) }] : []),
          r.status === "suspended"
            ? { label: "Reactivate", onSelect: () => setStatus(r, "active", "reactivated"), separatorBefore: true }
            : { label: "Suspend access", onSelect: () => setStatus(r, "suspended", "suspended"), destructive: true, separatorBefore: true, disabled: r.status === "invited" },
          ...(r.status === "invited"
            ? [
                {
                  label: "Revoke invite",
                  destructive: true,
                  onSelect: () =>
                    act(async () => {
                      await deleteRow("users", r.id);
                      await audit(actor, "deleted", "user", r.name);
                    }, `Invite for ${r.name} revoked`),
                },
              ]
            : []),
        ]}
        empty={{ title: "No users yet", action: invite }}
      />
      <FormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`Edit ${editing?.name ?? "user"}`}
        submitLabel="Save changes"
        successMessage="User updated"
        initialValues={editing ? { role: editing.role, region: editing.region } : undefined}
        fields={[
          { name: "role", label: "Role", type: "select", options: roleOptions, required: true },
          { name: "region", label: "Region", type: "select", options: REGION_OPTIONS, required: true },
        ]}
        onSubmit={async (v) => {
          const r = editing!;
          await updateRow("users", r.id, v);
          if (v.role !== r.role) await audit(actor, "updated", "user", r.name, { field: "role", from: roleLabel(r.role, roleList), to: roleLabel(v.role!, roleList) });
          if (v.region !== r.region) await audit(actor, "updated", "user", r.name, { field: "region", from: r.region, to: v.region });
          await refresh();
        }}
      />
    </>
  );
}
