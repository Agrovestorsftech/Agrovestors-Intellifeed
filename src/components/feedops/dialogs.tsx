// Feed Ops dialogs shared by module pages, the dashboard header and quick actions.
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormDialog, type FieldDef } from "@/components/data/FormDialog";
import { useRefresh } from "@/components/data/useAction";
import { useAuth } from "@/lib/auth/AuthContext";
import { confirmOrder } from "@/lib/ops/backend";
import {
  BAG_KG,
  createBatch,
  listOrders,
  listProduction,
  listProducts,
  productOptions,
  QC_LIMITS,
  recordQualityCheck,
  requestTransfer,
  scheduleDelivery,
  IS_API,
  useWarehouseOptions,
  useWarehouses,
} from "@/lib/ops/api";

/** "New batch" dialog, shared with the dashboard header and quick actions. */
export function NewBatchDialog({ trigger }: { trigger: ReactNode }) {
  const refresh = useRefresh();
  const products = useQuery({ queryKey: ["ops-products"], queryFn: listProducts });
  const warehouseOptions = useWarehouseOptions();
  const today = new Date().toISOString().slice(0, 16);
  return (
    <FormDialog
      title="New production batch"
      description="Queue a batch for the mill. Completed batches are bagged into inventory."
      submitLabel="Queue batch"
      successMessage="Batch queued"
      initialValues={{ start: today }}
      fields={[
        { name: "product_id", label: "Product", type: "select", options: productOptions(products.data ?? []), required: true, full: true },
        { name: "quantity", label: "Quantity (kg)", type: "number", min: 500, step: 100, required: true, placeholder: "e.g. 5000", hint: `≈ bags of ${BAG_KG} kg` },
        { name: "start", label: "Planned start", type: "datetime-local" },
        // api mode: bags go to this warehouse once the batch passes its quality check.
        ...(IS_API ? [{ name: "warehouse", label: "Store in", type: "select" as const, options: warehouseOptions, required: true }] : []),
      ]}
      onSubmit={async (v) => {
        const bagKg = (products.data ?? []).find((p) => p.id === v.product_id)?.bag_size_kg;
        await createBatch({ product_id: v.product_id!, quantity: Number(v.quantity), start: v.start ? new Date(v.start).toISOString() : "", warehouse: v.warehouse, bagKg });
        await refresh();
      }}
      trigger={trigger}
    />
  );
}


const DRIVERS = ["Yakubu Ali", "Peter Okon", "Ibrahim Sani", "Joseph Edet"];
const VEHICLES = ["KAD-482-XA", "LAG-119-KJ", "ABJ-730-MN", "IBD-044-PQ"];

/** Schedule a delivery for a processing order. Used by Deliveries, Orders and quick actions. */
export function ScheduleDeliveryDialog({
  trigger,
  open,
  onOpenChange,
  presetOrderId,
}: {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  presetOrderId?: string;
}) {
  const refresh = useRefresh();
  const orders = useQuery({ queryKey: ["ops-orders"], queryFn: listOrders });
  const warehouseOptions = useWarehouseOptions();
  const ready = (orders.data ?? []).filter((o) => o.status === "processing" || o.id === presetOrderId);
  const tomorrow = new Date(Date.now() + 86_400_000);
  tomorrow.setHours(9, 0, 0, 0);
  const local = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule delivery"
      description={ready.length ? "Assign a driver and vehicle to a confirmed order." : "No confirmed orders are waiting. Confirm an order first."}
      submitLabel="Schedule delivery"
      successMessage="Delivery scheduled"
      initialValues={{ order_id: presetOrderId ?? ready[0]?.id ?? "", scheduled_for: local, driver: DRIVERS[0]!, vehicle: VEHICLES[0]! }}
      fields={[
        {
          name: "order_id",
          label: "Order",
          type: "select",
          required: true,
          full: true,
          options: ready.map((o) => ({ value: o.id, label: `${o.order_no} · ${o.farmers?.farm_name ?? "—"} · ${o.quantity} bags` })),
        },
        { name: "driver", label: "Driver", type: "select", options: DRIVERS.map((d) => ({ value: d, label: d })), required: true },
        { name: "vehicle", label: "Vehicle", type: "select", options: VEHICLES.map((d) => ({ value: d, label: d })), required: true },
        { name: "scheduled_for", label: "Delivery time", type: "datetime-local", required: true, full: true },
        // api mode: the order's bags leave this warehouse when the delivery is dispatched.
        ...(IS_API ? [{ name: "warehouse", label: "Dispatch from", type: "select" as const, options: warehouseOptions, required: true, full: true }] : []),
      ]}
      onSubmit={async (v) => {
        const order = (orders.data ?? []).find((o) => o.id === v.order_id);
        await scheduleDelivery({ order_id: v.order_id!, driver: v.driver!, vehicle: v.vehicle!, scheduled_for: v.scheduled_for!, region: order?.farmers?.region, warehouse: v.warehouse });
        await refresh();
      }}
    />
  );
}


const RESULT_FIELDS: FieldDef[] = [
  { name: "moisture", label: "Moisture (%)", type: "number", step: 0.1, min: 0, max: 30, required: true, hint: `Pass ≤ ${QC_LIMITS.moisture}%` },
  { name: "protein", label: "Crude protein (%)", type: "number", step: 0.1, min: 0, max: 60, required: true },
  { name: "aflatoxin", label: "Aflatoxin (ppb)", type: "number", step: 1, min: 0, max: 500, required: true, hint: `Pass ≤ ${QC_LIMITS.aflatoxin} ppb` },
  { name: "notes", label: "Notes", type: "textarea" },
];

/** Record lab results for a batch. With no `checkId`, lets you pick any completed batch. */
export function QualityCheckDialog({ trigger, open, onOpenChange, checkId, title }: { trigger?: ReactNode; open?: boolean; onOpenChange?: (o: boolean) => void; checkId?: string; title?: string }) {
  const refresh = useRefresh();
  const me = useAuth().session?.user.name ?? "Inspector";
  const runs = useQuery({ queryKey: ["ops-production"], queryFn: listProduction });
  const completed = (runs.data ?? []).filter((r) => (IS_API ? r.backend_status === "awaiting_qc" : r.status === "completed"));
  const fields: FieldDef[] = checkId
    ? RESULT_FIELDS
    : [
        {
          name: "run_id",
          label: "Batch",
          type: "select",
          required: true,
          full: true,
          options: completed.map((r) => ({ value: r.id, label: `${r.batch_no} · ${r.feed_products?.name ?? ""}` })),
        },
        ...RESULT_FIELDS,
      ];
  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? "Record quality check"}
      description="Results outside the limits fail automatically and hold the batch."
      submitLabel="Save results"
      fields={fields}
      onSubmit={async (v) => {
        const result = await recordQualityCheck({
          id: checkId,
          run_id: v.run_id,
          moisture: Number(v.moisture),
          protein: Number(v.protein),
          aflatoxin: Number(v.aflatoxin),
          inspector: me,
          notes: v.notes,
        });
        await refresh();
        if (result === "pass") toast.success(IS_API ? "Batch passed and its bags were added to stock" : "Batch passed quality control");
        else toast.warning(IS_API ? "Batch failed and was rejected — its bags stay out of stock" : "Batch failed — hold it for re-test");
      }}
    />
  );
}


/** api mode: the backend prices orders when FeedOps confirms them (₦ per bag
 * for each product), with the expected delivery date and any delivery fee. */
export function ConfirmOrderDialog({
  order,
  onOpenChange,
}: {
  /** An order row from listOrders (api mode adds `items`). */
  order: Record<string, any> | null;
  onOpenChange: (open: boolean) => void;
}) {
  const refresh = useRefresh();
  const items: { id: string; product: string; bags: number }[] = order?.items ?? [];
  const inAWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  return (
    <FormDialog
      open={!!order}
      onOpenChange={onOpenChange}
      title={`Confirm ${order?.order_no ?? "order"}`}
      description="Set the price per bag. The farmer sees the total and the expected delivery date."
      submitLabel="Confirm order"
      successMessage={`${order?.order_no ?? "Order"} confirmed`}
      initialValues={{ expected_delivery: inAWeek, delivery_fee: "0" }}
      fields={[
        ...items.map((it): FieldDef => ({
          name: `price_${it.id}`,
          label: `${it.product} — ₦ per bag (${it.bags} bags)`,
          type: "number",
          min: 1,
          required: true,
          full: true,
        })),
        { name: "expected_delivery", label: "Expected delivery", type: "date", required: true },
        { name: "delivery_fee", label: "Delivery fee (₦)", type: "number", min: 0 },
      ]}
      onSubmit={async (v) => {
        const prices = Object.fromEntries(items.map((it) => [it.id, Number(v[`price_${it.id}`])]));
        await confirmOrder(order!.id, prices, v.expected_delivery!, Number(v.delivery_fee || 0));
        await refresh();
      }}
    />
  );
}

export function NewTransferDialog({ trigger }: { trigger: ReactNode }) {
  const refresh = useRefresh();
  const me = useAuth().session?.user.name ?? "FeedOps";
  const products = useQuery({ queryKey: ["ops-products"], queryFn: listProducts });
  const warehouses = useWarehouses();
  const warehouseOptions = useWarehouseOptions();
  return (
    <FormDialog
      trigger={trigger}
      title="New stock transfer"
      description="Stock leaves the source warehouse when dispatched and arrives when received."
      submitLabel="Request transfer"
      successMessage="Transfer requested"
      initialValues={{ from_warehouse: warehouses[0] ?? "", to_warehouse: warehouses[1] ?? "" }}
      fields={[
        { name: "product_id", label: "Product", type: "select", options: productOptions(products.data ?? []), required: true, full: true },
        { name: "from_warehouse", label: "From", type: "select", options: warehouseOptions, required: true },
        { name: "to_warehouse", label: "To", type: "select", options: warehouseOptions, required: true },
        { name: "quantity", label: "Bags", type: "number", min: 1, required: true },
      ]}
      validate={(v) => ({ to_warehouse: v.from_warehouse === v.to_warehouse ? "Pick a different warehouse." : undefined })}
      onSubmit={async (v) => {
        await requestTransfer({ product_id: v.product_id!, from_warehouse: v.from_warehouse!, to_warehouse: v.to_warehouse!, quantity: Number(v.quantity), requested_by: me });
        await refresh();
      }}
    />
  );
}

