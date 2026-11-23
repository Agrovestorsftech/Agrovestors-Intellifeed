import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { useAction } from "@/components/data/useAction";
import { CreateRoleDialog } from "@/components/admin/dialogs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { audit, deleteRow, listRoles, listUsers, updateRow, useActorName } from "@/lib/ops/api";
import { PERMISSIONS, PERMISSION_LABELS } from "@/lib/ops/people";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({ meta: [{ title: "Roles & Permissions — IntelliFeed360" }] }),
  component: RolesPage,
});

type Role = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  permissions: string[];
  system: boolean;
};

const GROUPS: { title: string; perms: string[] }[] = [
  {
    title: "Farmers & field work",
    perms: ["farmers.view", "farmers.edit", "visits.create", "reports.submit"],
  },
  { title: "Nutrition & health", perms: ["reports.review", "plans.publish", "cases.manage"] },
  {
    title: "Feed operations",
    perms: ["orders.create", "orders.manage", "inventory.manage", "production.manage"],
  },
  {
    title: "Administration",
    perms: ["users.manage", "roles.manage", "billing.view", "settings.manage"],
  },
];

function RolesPage() {
  const act = useAction();
  const actor = useActorName();
  const roles = useQuery({ queryKey: ["admin-roles"], queryFn: listRoles });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const list = (roles.data ?? []) as Role[];
  const members = (key: string) => (users.data ?? []).filter((u) => u.role === key).length;

  const qc = useQueryClient();
  const toggle = (r: Role, perm: string, on: boolean) => {
    const next = on ? [...r.permissions, perm] : r.permissions.filter((p) => p !== perm);
    // Tick the box immediately; the refetch after saving confirms it (or reverts on error).
    qc.setQueryData<Role[]>(["admin-roles"], (old) =>
      old?.map((x) => (x.id === r.id ? { ...x, permissions: next } : x)),
    );
    return act(async () => {
      await updateRow("roles", r.id, { permissions: next });
      await audit(actor, "updated", "role", r.name, {
        field: PERMISSION_LABELS[perm]!,
        from: on ? "off" : "on",
        to: on ? "on" : "off",
      });
    });
  };

  const remove = (r: Role) =>
    act(async () => {
      if (members(r.key) > 0)
        throw new Error(`Move the ${members(r.key)} user(s) with this role to another role first.`);
      await deleteRow("roles", r.id);
      await audit(actor, "deleted", "role", r.name);
    }, `${r.name} deleted`);

  const create = (
    <CreateRoleDialog
      trigger={
        <Button className="h-10">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Create role
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Who can do what. Built-in roles map to the four dashboards."
        actions={create}
      />

      {roles.error ? (
        <div role="alert" className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-foreground">Couldn't load roles.</p>
          <Button variant="outline" className="mt-3" onClick={() => roles.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {(roles.isLoading ? Array.from({ length: 5 }, () => null) : list).map((r, i) =>
              r ? (
                <div
                  key={r.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary"
                      aria-hidden="true"
                    >
                      {r.system ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                    </span>
                    {!r.system && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${r.name}`}
                        onClick={() => remove(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-3 font-medium text-foreground">{r.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {r.description ?? "Custom role"}
                  </p>
                  <p className="mt-auto pt-3 text-xs text-muted-foreground">
                    <span className="font-medium tabular-nums text-foreground">
                      {members(r.key)}
                    </span>{" "}
                    users ·{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {r.permissions.length}
                    </span>{" "}
                    permissions
                  </p>
                </div>
              ) : (
                <div key={i} className="h-36 rounded-2xl bg-muted motion-safe:animate-pulse" />
              ),
            )}
          </div>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Permission matrix</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Changes apply immediately and are recorded in the audit trail. System Administrator
                always has full access.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th scope="col" className="px-6 py-3 font-medium">
                      Permission
                    </th>
                    {list.map((r) => (
                      <th key={r.id} scope="col" className="px-3 py-3 text-center font-medium">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GROUPS.map((g) => (
                    <PermGroup
                      key={g.title}
                      title={g.title}
                      perms={g.perms.filter((p) => PERMISSIONS.includes(p))}
                      roles={list}
                      onToggle={toggle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function PermGroup({
  title,
  perms,
  roles,
  onToggle,
}: {
  title: string;
  perms: string[];
  roles: Role[];
  onToggle: (r: Role, p: string, on: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-muted/20">
        <th
          scope="rowgroup"
          colSpan={roles.length + 1}
          className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {title}
        </th>
      </tr>
      {perms.map((p) => (
        <tr key={p} className="border-b border-border last:border-0">
          <th scope="row" className="px-6 py-3 text-left font-normal text-foreground">
            {PERMISSION_LABELS[p]}
          </th>
          {roles.map((r) => {
            const locked = r.key === "system_admin";
            return (
              <td key={r.id} className="px-3 py-3 text-center">
                <Checkbox
                  checked={r.permissions.includes(p)}
                  disabled={locked}
                  aria-label={`${PERMISSION_LABELS[p]} for ${r.name}`}
                  onCheckedChange={(v) => onToggle(r, p, v === true)}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
