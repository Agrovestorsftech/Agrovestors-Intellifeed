import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, PackagePlus, PackageX, Wallet } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { FormDialog } from "@/components/data/FormDialog";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { useRefresh } from "@/components/data/useAction";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/dashboard/queries";
import {
  adjustStock,
  listInventory,
  listProducts,
  naira,
  productOptions,
  requestTransfer,
  setReorderLevel,
  stockStatus,
  warehouseOptions,
  WAREHOUSES,
} from "@/lib/ops/api";
import { useAuth } from "@/lib/auth/AuthContext";

export const Route = createFileRoute("/feedops/inventory")({
  head: () => ({ meta: [{ title: "Feed Inventory — IntelliFeed360" }] }),
  component: InventoryPage,
});

type Row = Awaited<ReturnType<typeof listInventory>>[number];
type Dialog = { kind: "adjust" | "reorder" | "transfer"; row: Row } | null;

function InventoryPage() {
  const refresh = useRefresh();
  const me = useAuth().session?.user.name ?? "FeedOps";
  const inv = useQuery({ queryKey: ["ops-inventory"], queryFn: listInventory });
  const products = useQuery({ queryKey: ["ops-products"], queryFn: listProducts });
  const [dialog, setDialog] = useState<Dialog>(null);

  const data = inv.data ?? [];
  const value = data.reduce((s, r) => s + Number(r.quantity) * Number(r.feed_products?.price_per_unit ?? 0), 0);
  const units = data.reduce((s, r) => s + Number(r.quantity), 0);
  const low = data.filter((r) => stockStatus(r) === "low_stock").length;
  const out = data.filter((r) => stockStatus(r) === "out_of_stock").length;

  const columns: Column<Row>[] = [
    {
      key: "product",
      header: "Product",
      sort: (r) => r.feed_products?.name,
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{r.feed_products?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.feed_products?.sku}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", hideBelow: "md", sort: (r) => r.feed_products?.category, cell: (r) => <span className="capitalize">{r.feed_products?.category ?? "—"}</span> },
    { key: "warehouse", header: "Warehouse", sort: (r) => r.warehouse, cell: (r) => r.warehouse },
    { key: "qty", header: "On hand", align: "right", sort: (r) => Number(r.quantity), cell: (r) => `${Number(r.quantity).toLocaleString()} ${r.feed_products?.unit ?? "bag"}s` },
    { key: "reorder", header: "Reorder at", align: "right", hideBelow: "lg", sort: (r) => Number(r.reorder_level), cell: (r) => Number(r.reorder_level).toLocaleString() },
    { key: "value", header: "Value", align: "right", hideBelow: "md", sort: (r) => Number(r.quantity) * Number(r.feed_products?.price_per_unit ?? 0), cell: (r) => naira(Number(r.quantity) * Number(r.feed_products?.price_per_unit ?? 0)) },
    { key: "status", header: "Status", sort: (r) => stockStatus(r), cell: (r) => <StatusBadge status={stockStatus(r)} /> },
    { key: "updated", header: "Updated", hideBelow: "lg", sort: (r) => r.updated_at, cell: (r) => <span className="text-muted-foreground">{relativeTime(r.updated_at)}</span> },
  ];

  const addStock = (
    <FormDialog
      title="Add stock"
      description="Record bags received into a warehouse."
      submitLabel="Add stock"
      successMessage="Stock added"
      fields={[
        { name: "product_id", label: "Product", type: "select", options: productOptions(products.data ?? []), required: true, full: true },
        { name: "warehouse", label: "Warehouse", type: "select", options: warehouseOptions, required: true },
        { name: "quantity", label: "Bags received", type: "number", min: 1, required: true, placeholder: "e.g. 120" },
      ]}
      onSubmit={async (v) => {
        await adjustStock(v.product_id!, v.warehouse!, Number(v.quantity));
        await refresh();
      }}
      trigger={
        <Button className="h-10">
          <PackagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add stock
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader title="Feed Inventory" subtitle="Stock on hand across warehouses, with reorder alerts." actions={addStock} />
      <StatCards
        loading={inv.isLoading}
        stats={[
          { label: "Bags on hand", value: units.toLocaleString(), hint: `${WAREHOUSES.length} warehouses`, icon: Boxes, tone: "primary" },
          { label: "Stock value", value: naira(value), hint: "At current list price", icon: Wallet, tone: "info" },
          { label: "Low stock", value: low, hint: "At or below reorder level", icon: AlertTriangle, tone: "warning" },
          { label: "Out of stock", value: out, hint: "Needs production or transfer", icon: PackageX, tone: "destructive" },
        ]}
      />
      <DataTable
        rows={data}
        columns={columns}
        getId={(r) => r.id}
        loading={inv.isLoading}
        error={inv.error}
        onRetry={() => inv.refetch()}
        searchText={(r) => `${r.feed_products?.name} ${r.feed_products?.sku} ${r.warehouse}`}
        searchPlaceholder="Search product, SKU or warehouse"
        filters={[
          { id: "warehouse", label: "Warehouses", options: warehouseOptions, value: (r) => r.warehouse },
          {
            id: "status",
            label: "Statuses",
            options: [
              { value: "in_stock", label: "In stock" },
              { value: "low_stock", label: "Low stock" },
              { value: "out_of_stock", label: "Out of stock" },
            ],
            value: (r) => stockStatus(r),
          },
        ]}
        defaultSort={{ key: "qty", dir: "asc" }}
        rowLabel={(r) => `${r.feed_products?.name} at ${r.warehouse}`}
        rowActions={(r) => [
          { label: "Adjust stock", onSelect: () => setDialog({ kind: "adjust", row: r }) },
          { label: "Transfer to other warehouse", onSelect: () => setDialog({ kind: "transfer", row: r }), disabled: Number(r.quantity) <= 0 },
          { label: "Set reorder level", onSelect: () => setDialog({ kind: "reorder", row: r }) },
        ]}
        empty={{ title: "No stock recorded", hint: "Add stock to start tracking inventory.", action: addStock }}
      />

      <FormDialog
        open={dialog?.kind === "adjust"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Adjust stock"
        description={dialog ? `${dialog.row.feed_products?.name} at ${dialog.row.warehouse} · ${dialog.row.quantity} on hand` : undefined}
        submitLabel="Save adjustment"
        successMessage="Stock adjusted"
        fields={[
          { name: "delta", label: "Change (bags)", type: "number", required: true, hint: "Use a negative number to remove stock, e.g. -10", step: 1 },
          { name: "reason", label: "Reason", type: "select", options: ["Stock count correction", "Damaged / expired", "Returned by customer", "Sample / internal use"].map((v) => ({ value: v, label: v })) },
        ]}
        validate={(v) => ({ delta: Number(v.delta) === 0 ? "Enter a change other than 0." : undefined })}
        onSubmit={async (v) => {
          await adjustStock(dialog!.row.product_id, dialog!.row.warehouse, Number(v.delta));
          await refresh();
        }}
      />
      <FormDialog
        open={dialog?.kind === "reorder"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Set reorder level"
        description="You'll get a low-stock alert at or below this level."
        submitLabel="Save"
        successMessage="Reorder level updated"
        initialValues={dialog ? { level: String(dialog.row.reorder_level) } : undefined}
        fields={[{ name: "level", label: "Reorder level (bags)", type: "number", min: 0, required: true }]}
        onSubmit={async (v) => {
          await setReorderLevel(dialog!.row.id, Number(v.level));
          await refresh();
        }}
      />
      <FormDialog
        open={dialog?.kind === "transfer"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Request stock transfer"
        description={dialog ? `Move ${dialog.row.feed_products?.name} out of ${dialog.row.warehouse}.` : undefined}
        submitLabel="Request transfer"
        successMessage="Transfer requested"
        fields={[{ name: "quantity", label: "Bags to move", type: "number", min: 1, max: dialog ? Number(dialog.row.quantity) : undefined, required: true }]}
        onSubmit={async (v) => {
          const r = dialog!.row;
          await requestTransfer({
            product_id: r.product_id,
            from_warehouse: r.warehouse,
            to_warehouse: WAREHOUSES.find((w) => w !== r.warehouse)!,
            quantity: Number(v.quantity),
            requested_by: me,
          });
          await refresh();
        }}
      />
    </>
  );
}
