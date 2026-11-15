// Admin dialogs shared by module pages, the dashboard header and quick actions.
import type { ReactNode } from "react";
import { FormDialog } from "@/components/data/FormDialog";
import { useRefresh } from "@/components/data/useAction";
import { audit, insertRow, useActorName } from "@/lib/ops/api";
import { PERMISSIONS, PERMISSION_LABELS, REGION_OPTIONS, ROLE_OPTIONS, roleLabel } from "@/lib/ops/people";

export function InviteUserDialog({ trigger, defaultRole = "field_agent", title = "Invite user" }: { trigger: ReactNode; defaultRole?: string; title?: string }) {
  const refresh = useRefresh();
  const actor = useActorName();
  return (
    <FormDialog
      trigger={trigger}
      title={title}
      description="They'll get an email invite to set up their account."
      submitLabel="Send invite"
      successMessage="Invite sent"
      initialValues={{ role: defaultRole, region: defaultRole === "system_admin" ? "HQ" : "Kaduna" }}
      fields={[
        { name: "name", label: "Full name", required: true, autoComplete: "name" },
        { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
        { name: "role", label: "Role", type: "select", options: ROLE_OPTIONS, required: true },
        { name: "region", label: "Region", type: "select", options: REGION_OPTIONS, required: true },
        { name: "phone", label: "Phone", type: "tel", autoComplete: "tel", full: true },
      ]}
      onSubmit={async (v) => {
        await insertRow("users", { ...v, status: "invited", last_active_at: null });
        await audit(actor, "created", "user", v.name!, { field: "role", from: null, to: roleLabel(v.role!) });
        await refresh();
      }}
    />
  );
}

export function CreateRoleDialog({ trigger }: { trigger: ReactNode }) {
  const refresh = useRefresh();
  const actor = useActorName();
  return (
    <FormDialog
      trigger={trigger}
      title="Create role"
      description="Start from a base set of permissions; fine-tune them in the matrix afterwards."
      submitLabel="Create role"
      successMessage="Role created"
      initialValues={{ base: "farmers.view" }}
      fields={[
        { name: "name", label: "Role name", required: true, full: true, placeholder: "e.g. Regional Supervisor" },
        { name: "description", label: "Description", type: "textarea", placeholder: "What this role is for" },
        {
          name: "base",
          label: "Starting permission",
          type: "select",
          full: true,
          options: PERMISSIONS.map((p) => ({ value: p, label: PERMISSION_LABELS[p]! })),
        },
      ]}
      onSubmit={async (v) => {
        const key = v.name!.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
        await insertRow("roles", { key, name: v.name, description: v.description || null, permissions: [v.base], system: false });
        await audit(actor, "created", "role", v.name!);
        await refresh();
      }}
    />
  );
}
