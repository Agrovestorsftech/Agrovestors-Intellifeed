import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Layers, Plus, Star, Truck } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { FormDialog, type FieldDef } from "@/components/data/FormDialog";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { useAction, useRefresh } from "@/components/data/useAction";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/dashboard/queries";
import { listSuppliers, recordSupplierOrder, saveSupplier, setSupplierStatus } from "@/lib/ops/api";

export const Route = createFileRoute("/feedops/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — IntelliFeed360" }] }),
  component: SuppliersPage,
});

type Row = Awaited<ReturnType<typeof listSuppliers>>[number];

const CATEGORIES = ["Maize", "Soybean meal", "Fishmeal", "Wheat offal", "Vitamin premix", "Limestone", "Vegetable oil", "Packaging"];

const FIELDS: FieldDef[] = [
  { name: "name", label: "Company name", required: true, full: true, autoComplete: "organization" },
  { name: "category", label: "Supplies", type: "select", options: CATEGORIES.map((c) => ({ value: c, label: c })), required: true },
  { name: "region", label: "Region", placeholder: "e.g. Kano" },
  { name: "contact_name", label: "Contact person", autoComplete: "name" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "email", label: "Email", type: "email", full: true, autoComplete: "email" },
];

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
      {value.toFixed(1)}
    </span>
  );
}

function SuppliersPage() {
  const act = useAction();
  const refresh = useRefresh();
  const q = useQuery({ queryKey: ["ops-suppliers"], queryFn: listSuppliers });
  const [editing, setEditing] = useState<Row | null>(null);
  const data = q.data ?? [];
  const active = data.filter((r) => r.status === "active");
  const avg = active.length ? active.reduce((s, r) => s + Number(r.rating), 0) / active.length : 0;

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Supplier",
      sort: (r) => r.name,
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.region}</p>
        </div>
      ),
    },
    { key: "category", header: "Supplies", sort: (r) => r.category, cell: (r) => r.category },
    {
      key: "contact",
      header: "Contact",
      hideBelow: "md",
      cell: (r) => (
        <div className="text-xs">
          <p className="text-foreground">{r.contact_name}</p>
          <a href={`tel:${r.phone}`} className="text-muted-foreground hover:text-foreground hover:underline">
            {r.phone}
          </a>
        </div>
      ),
    },
    { key: "rating", header: "Rating", align: "right", sort: (r) => Number(r.rating), cell: (r) => <Rating value={Number(r.rating)} /> },
    { key: "last", header: "Last order", hideBelow: "sm", sort: (r) => r.last_order_at, cell: (r) => <span className="text-muted-foreground">{r.last_order_at ? relativeTime(r.last_order_at) : "Never"}</span> },
    { key: "status", header: "Status", sort: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const add = (
    <FormDialog
      title="Add supplier"
      submitLabel="Add supplier"
      successMessage="Supplier added"
      fields={FIELDS}
      onSubmit={async (v) => {
        await saveSupplier(v);
        await refresh();
      }}
      trigger={
        <Button className="h-10">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add supplier
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader title="Suppliers" subtitle="Raw material and packaging suppliers for the mill." actions={add} />
      <StatCards
        loading={q.isLoading}
        stats={[
          { label: "Active suppliers", value: active.length, hint: `${data.length - active.length} inactive`, icon: Building2, tone: "primary" },
          { label: "Categories covered", value: new Set(active.map((r) => r.category)).size, hint: `of ${CATEGORIES.length} inputs`, icon: Layers, tone: "info" },
          { label: "Average rating", value: avg.toFixed(1), hint: "Active suppliers", icon: Star, tone: "warning" },
          { label: "Ordered this month", value: data.filter((r) => r.last_order_at && Date.now() - new Date(r.last_order_at).getTime() < 30 * 86_400_000).length, hint: "Suppliers used in 30 days", icon: Truck, tone: "success" },
        ]}
      />
      <DataTable
        rows={data}
        columns={columns}
        getId={(r) => r.id}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchText={(r) => `${r.name} ${r.category} ${r.region} ${r.contact_name}`}
        searchPlaceholder="Search supplier, input or contact"
        filters={[
          { id: "category", label: "Inputs", options: CATEGORIES.map((c) => ({ value: c, label: c })), value: (r) => r.category },
          { id: "status", label: "Statuses", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }], value: (r) => r.status },
        ]}
        rowLabel={(r) => r.name}
        rowActions={(r) => [
          { label: "Edit details", onSelect: () => setEditing(r) },
          { label: "Record purchase order", onSelect: () => act(() => recordSupplierOrder(r.id), `Order recorded for ${r.name}`), disabled: r.status !== "active" },
          r.status === "active"
            ? { label: "Deactivate", onSelect: () => act(() => setSupplierStatus(r.id, "inactive"), `${r.name} deactivated`), destructive: true, separatorBefore: true }
            : { label: "Reactivate", onSelect: () => act(() => setSupplierStatus(r.id, "active"), `${r.name} reactivated`), separatorBefore: true },
        ]}
        empty={{ title: "No suppliers yet", hint: "Add the companies you buy inputs from.", action: add }}
      />
      <FormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit supplier"
        submitLabel="Save changes"
        successMessage="Supplier updated"
        fields={FIELDS}
        initialValues={editing ? Object.fromEntries(FIELDS.map((f) => [f.name, String(editing[f.name] ?? "")])) : undefined}
        onSubmit={async (v) => {
          await saveSupplier(v, editing!.id);
          await refresh();
        }}
      />
    </>
  );
}
