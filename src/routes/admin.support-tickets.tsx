import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Inbox, LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { FormDialog } from "@/components/data/FormDialog";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge, humanize } from "@/components/data/StatusBadge";
import { useAction, useRefresh } from "@/components/data/useAction";
import { useAuth } from "@/lib/auth/AuthContext";
import { relativeTime } from "@/lib/dashboard/queries";
import { audit, listTickets, listUsers, staffNamer, updateRow, useActorName } from "@/lib/ops/api";

export const Route = createFileRoute("/admin/support-tickets")({
  head: () => ({ meta: [{ title: "Support Tickets — IntelliFeed360" }] }),
  component: TicketsPage,
});

type Row = Awaited<ReturnType<typeof listTickets>>[number];

const STATUSES = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const PORTALS: Record<string, string> = {
  field: "Field Agent",
  agent: "Admin Agent",
  feedops: "FeedOps",
  admin: "Admin",
};
const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: humanize(x) }));

function TicketsPage() {
  const act = useAction();
  const refresh = useRefresh();
  const actor = useActorName();
  const me = useAuth().session?.user;
  const q = useQuery({ queryKey: ["admin-tickets"], queryFn: listTickets });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const [editing, setEditing] = useState<Row | null>(null);
  const data = q.data ?? [];
  const who = staffNamer(users.data ?? [], me);
  const assignees = [
    { value: "Support Desk", label: "Support Desk" },
    ...(users.data ?? [])
      .filter((u) => u.role === "system_admin" && u.status === "active")
      .map((u) => ({ value: u.name as string, label: u.name as string })),
  ];

  const isOpen = (r: Row) => r.status === "open" || r.status === "in_progress";
  const columns: Column<Row>[] = [
    {
      key: "subject",
      header: "Ticket",
      sort: (r) => r.subject,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.subject}</p>
          <p className="truncate text-xs text-muted-foreground">
            {who(r.opened_by)} · {PORTALS[r.portal] ?? r.portal}
          </p>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sort: (r) => PRIORITIES.indexOf(r.priority),
      cell: (r) => <StatusBadge status={r.priority} />,
    },
    {
      key: "assigned",
      header: "Assigned to",
      hideBelow: "md",
      sort: (r) => r.assigned_to,
      cell: (r) => r.assigned_to ?? <span className="text-muted-foreground">Unassigned</span>,
    },
    {
      key: "updated",
      header: "Updated",
      hideBelow: "lg",
      sort: (r) => r.updated_at,
      cell: (r) => <span className="text-muted-foreground">{relativeTime(r.updated_at)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sort: (r) => STATUSES.indexOf(r.status),
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const setStatus = (r: Row, status: string) =>
    act(
      async () => {
        await updateRow("support_tickets", r.id, {
          status,
          updated_at: new Date().toISOString(),
          assigned_to: r.assigned_to ?? actor,
        });
        await audit(actor, "updated", "support_ticket", r.subject, {
          field: "status",
          from: humanize(r.status),
          to: humanize(status),
        });
      },
      `Ticket marked ${humanize(status).toLowerCase()}`,
    );

  return (
    <>
      <PageHeader
        title="Support Tickets"
        subtitle="Issues and complaints raised from every dashboard and the farmer app."
      />
      <StatCards
        loading={q.isLoading}
        stats={[
          {
            label: "Open",
            value: data.filter((r) => r.status === "open").length,
            hint: "Not picked up yet",
            icon: Inbox,
            tone: "warning",
          },
          {
            label: "In progress",
            value: data.filter((r) => r.status === "in_progress").length,
            hint: "Being worked on",
            icon: LifeBuoy,
            tone: "info",
          },
          {
            label: "Urgent & open",
            value: data.filter(
              (r) => isOpen(r) && (r.priority === "urgent" || r.priority === "high"),
            ).length,
            hint: "High or urgent priority",
            icon: AlertTriangle,
            tone: "destructive",
          },
          {
            label: "Resolved",
            value: data.filter((r) => !isOpen(r)).length,
            hint: "Resolved or closed",
            icon: CheckCircle2,
            tone: "success",
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
        searchText={(r) => `${r.subject} ${r.description} ${r.assigned_to ?? ""}`}
        searchPlaceholder="Search tickets"
        filters={[
          { id: "status", label: "Statuses", options: opt(STATUSES), value: (r) => r.status },
          {
            id: "priority",
            label: "Priorities",
            options: opt(PRIORITIES),
            value: (r) => r.priority,
          },
          {
            id: "portal",
            label: "Sources",
            options: Object.entries(PORTALS).map(([value, label]) => ({ value, label })),
            value: (r) => r.portal,
          },
        ]}
        defaultSort={{ key: "priority", dir: "desc" }}
        rowLabel={(r) => r.subject}
        rowActions={(r) => [
          { label: "Assign & prioritise", onSelect: () => setEditing(r) },
          ...(r.status === "open"
            ? [{ label: "Start working", onSelect: () => setStatus(r, "in_progress") }]
            : []),
          ...(isOpen(r)
            ? [{ label: "Mark resolved", onSelect: () => setStatus(r, "resolved") }]
            : [{ label: "Reopen", onSelect: () => setStatus(r, "open") }]),
          ...(r.status !== "closed"
            ? [{ label: "Close", onSelect: () => setStatus(r, "closed"), separatorBefore: true }]
            : []),
        ]}
        empty={{ title: "No tickets", hint: "Nothing has been reported yet." }}
      />
      <FormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing?.subject ?? "Ticket"}
        description={editing?.description}
        submitLabel="Save"
        successMessage="Ticket updated"
        initialValues={
          editing
            ? {
                assigned_to: editing.assigned_to ?? "Support Desk",
                priority: editing.priority,
                note: "",
              }
            : undefined
        }
        fields={[
          {
            name: "assigned_to",
            label: "Assign to",
            type: "select",
            options: assignees,
            required: true,
          },
          {
            name: "priority",
            label: "Priority",
            type: "select",
            options: opt(PRIORITIES),
            required: true,
          },
          {
            name: "note",
            label: "Internal note",
            type: "textarea",
            placeholder: "Optional: what's been done or what's next",
          },
        ]}
        onSubmit={async (v) => {
          const r = editing!;
          await updateRow("support_tickets", r.id, {
            assigned_to: v.assigned_to,
            priority: v.priority,
            status: r.status === "open" ? "in_progress" : r.status,
            notes: v.note || r.notes || null,
            updated_at: new Date().toISOString(),
          });
          if (v.priority !== r.priority)
            await audit(actor, "updated", "support_ticket", r.subject, {
              field: "priority",
              from: r.priority,
              to: v.priority,
            });
          if (v.assigned_to !== r.assigned_to)
            await audit(actor, "updated", "support_ticket", r.subject, {
              field: "assignee",
              from: r.assigned_to ?? "Unassigned",
              to: v.assigned_to,
            });
          await refresh();
        }}
      />
    </>
  );
}
