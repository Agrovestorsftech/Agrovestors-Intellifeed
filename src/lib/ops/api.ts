// Data access for the Feed Ops and Admin module pages (DEMO MODE: in-memory mock store).
import { mockDb as db } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth/AuthContext";

type Row = Record<string, any>;

async function rows(
  q: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<Row[]> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

async function run(q: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await q;
  if (error) throw new Error(error.message);
}

export const WAREHOUSES = ["Kaduna Central", "Ibadan Depot"];
export const BAG_KG = 25;

/* --------------------------------- lookups --------------------------------- */

export const listProducts = () => rows(db.from("feed_products").select("*").order("name"));
export const listUsers = () => rows(db.from("users").select("*").order("name"));
export const listFarmers = () =>
  rows(db.from("farmers").select("*, visit_reports(id), health_cases(status)").order("name"));

/* --------------------------------- inventory -------------------------------- */

export const listInventory = () =>
  rows(
    db
      .from("inventory_items")
      .select("*, feed_products(name, sku, unit, category, price_per_unit)"),
  );

export function stockStatus(r: Row): "in_stock" | "low_stock" | "out_of_stock" {
  const q = Number(r.quantity);
  return q <= 0 ? "out_of_stock" : q <= Number(r.reorder_level) ? "low_stock" : "in_stock";
}

/** Add (or remove, with a negative delta) bags of a product at a warehouse. */
export async function adjustStock(productId: string, warehouse: string, delta: number) {
  const { data } = await db
    .from("inventory_items")
    .select("*")
    .eq("product_id", productId)
    .eq("warehouse", warehouse);
  const existing = (data ?? [])[0];
  if (existing) {
    const next = Number(existing.quantity) + delta;
    if (next < 0) throw new Error(`Only ${existing.quantity} bags available at ${warehouse}.`);
    await run(
      db
        .from("inventory_items")
        .update({ quantity: next, updated_at: new Date().toISOString() })
        .eq("id", existing.id),
    );
  } else {
    if (delta < 0) throw new Error(`No stock of this product at ${warehouse}.`);
    await run(
      db.from("inventory_items").insert({
        product_id: productId,
        warehouse,
        quantity: delta,
        reorder_level: 100,
        updated_at: new Date().toISOString(),
      }),
    );
  }
}

export const setReorderLevel = (id: string, level: number) =>
  run(db.from("inventory_items").update({ reorder_level: level }).eq("id", id));

/* -------------------------------- production -------------------------------- */

export const listProduction = () =>
  rows(
    db
      .from("production_runs")
      .select("*, feed_products(name, unit)")
      .order("created_at", { ascending: false }),
  );

export async function createBatch(v: { product_id: string; quantity: number; start: string }) {
  const { data } = await db.from("production_runs").select("batch_no");
  const max = Math.max(
    2400,
    ...((data ?? []) as Row[]).map((r) => Number(String(r.batch_no).replace(/\D/g, "")) || 0),
  );
  await run(
    db.from("production_runs").insert({
      batch_no: `B-${max + 1}`,
      product_id: v.product_id,
      quantity: v.quantity,
      status: "queued",
      started_at: v.start || null,
      finished_at: null,
    }),
  );
}

export const startBatch = (id: string) =>
  run(
    db
      .from("production_runs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", id),
  );

/** Complete a batch: bag it into a warehouse and queue a quality check. */
export async function completeBatch(run_: Row, warehouse = WAREHOUSES[0]!) {
  const now = new Date().toISOString();
  await run(
    db.from("production_runs").update({ status: "completed", finished_at: now }).eq("id", run_.id),
  );
  await adjustStock(run_.product_id, warehouse, Math.round(Number(run_.quantity) / BAG_KG));
  await run(
    db.from("quality_checks").insert({
      run_id: run_.id,
      batch_no: run_.batch_no,
      product_id: run_.product_id,
      inspector: null,
      moisture: null,
      protein: null,
      aflatoxin: null,
      result: "pending",
      notes: null,
      checked_at: null,
    }),
  );
}

export const cancelBatch = (id: string) =>
  run(db.from("production_runs").update({ status: "cancelled" }).eq("id", id));

/* ---------------------------------- orders ---------------------------------- */

export const listOrders = () =>
  rows(
    db
      .from("feed_orders")
      .select("*, farmers(name, farm_name, region), feed_products(name, unit, price_per_unit)")
      .order("placed_at", { ascending: false }),
  );

export const setOrderStatus = (id: string, status: string) =>
  run(db.from("feed_orders").update({ status }).eq("id", id));

/* -------------------------------- deliveries -------------------------------- */

export async function listDeliveries(): Promise<Row[]> {
  const [dl, orders] = await Promise.all([
    rows(db.from("deliveries").select("*").order("scheduled_for", { ascending: false })),
    listOrders(),
  ]);
  const byId = new Map(orders.map((o) => [o.id, o]));
  return dl.map((d): Row => ({ ...d, order: byId.get(d.order_id) ?? null }));
}

export async function scheduleDelivery(v: {
  order_id: string;
  driver: string;
  vehicle: string;
  scheduled_for: string;
  region?: string;
}) {
  await run(
    db.from("deliveries").insert({
      order_id: v.order_id,
      driver: v.driver,
      vehicle: v.vehicle,
      region: v.region ?? null,
      scheduled_for: new Date(v.scheduled_for).toISOString(),
      delivered_at: null,
      status: "scheduled",
    }),
  );
  await setOrderStatus(v.order_id, "out_for_delivery");
}

export async function setDeliveryStatus(d: Row, status: "in_transit" | "delivered" | "failed") {
  await run(
    db
      .from("deliveries")
      .update({ status, delivered_at: status === "delivered" ? new Date().toISOString() : null })
      .eq("id", d.id),
  );
  if (status === "delivered") await setOrderStatus(d.order_id, "delivered");
  if (status === "failed") await setOrderStatus(d.order_id, "processing");
}

/* --------------------------------- suppliers -------------------------------- */

export const listSuppliers = () => rows(db.from("suppliers").select("*").order("name"));
export const saveSupplier = (v: Row, id?: string) =>
  id
    ? run(db.from("suppliers").update(v).eq("id", id))
    : run(db.from("suppliers").insert({ status: "active", rating: 4, last_order_at: null, ...v }));
export const setSupplierStatus = (id: string, status: string) =>
  run(db.from("suppliers").update({ status }).eq("id", id));
export const recordSupplierOrder = (id: string) =>
  run(db.from("suppliers").update({ last_order_at: new Date().toISOString() }).eq("id", id));

/* ------------------------------ quality control ----------------------------- */

export const QC_LIMITS = { moisture: 13.5, aflatoxin: 20 };

export const listQualityChecks = () =>
  rows(
    db
      .from("quality_checks")
      .select("*, feed_products(name)")
      .order("created_at", { ascending: false }),
  );

export async function recordQualityCheck(v: {
  id?: string;
  run_id?: string;
  moisture: number;
  protein: number;
  aflatoxin: number;
  inspector: string;
  notes?: string;
}) {
  const result =
    v.moisture > QC_LIMITS.moisture || v.aflatoxin > QC_LIMITS.aflatoxin ? "fail" : "pass";
  const patch = {
    moisture: v.moisture,
    protein: v.protein,
    aflatoxin: v.aflatoxin,
    inspector: v.inspector,
    notes: v.notes || (result === "fail" ? "Outside limits — hold batch." : null),
    result,
    checked_at: new Date().toISOString(),
  };
  if (v.id) await run(db.from("quality_checks").update(patch).eq("id", v.id));
  else {
    const { data } = await db
      .from("production_runs")
      .select("batch_no, product_id")
      .eq("id", v.run_id!)
      .single();
    await run(
      db.from("quality_checks").insert({
        run_id: v.run_id,
        batch_no: data?.batch_no,
        product_id: data?.product_id,
        ...patch,
      }),
    );
  }
  return result;
}

/* ------------------------------ stock transfers ----------------------------- */

export const listTransfers = () =>
  rows(
    db
      .from("stock_transfers")
      .select("*, feed_products(name, unit)")
      .order("created_at", { ascending: false }),
  );

export async function requestTransfer(v: {
  product_id: string;
  from_warehouse: string;
  to_warehouse: string;
  quantity: number;
  requested_by: string;
}) {
  const { data } = await db.from("stock_transfers").select("ref");
  const max = Math.max(
    3100,
    ...((data ?? []) as Row[]).map((r) => Number(String(r.ref).replace(/\D/g, "")) || 0),
  );
  await run(
    db.from("stock_transfers").insert({
      ...v,
      ref: `TRF-${max + 1}`,
      status: "requested",
      requested_at: new Date().toISOString(),
    }),
  );
}

export async function dispatchTransfer(t: Row) {
  await adjustStock(t.product_id, t.from_warehouse, -Number(t.quantity));
  await run(db.from("stock_transfers").update({ status: "in_transit" }).eq("id", t.id));
}

export async function receiveTransfer(t: Row) {
  await adjustStock(t.product_id, t.to_warehouse, Number(t.quantity));
  await run(db.from("stock_transfers").update({ status: "received" }).eq("id", t.id));
}

export const cancelTransfer = (id: string) =>
  run(db.from("stock_transfers").update({ status: "cancelled" }).eq("id", id));

/* ----------------------------------- admin ---------------------------------- */

export const listRoles = () => rows(db.from("roles").select("*").order("created_at"));
export const listInvoices = () =>
  rows(db.from("invoices").select("*").order("issued_at", { ascending: false }));
export const listSystemLogs = () =>
  rows(db.from("system_logs").select("*").order("created_at", { ascending: false }));
export const listAuditEvents = () =>
  rows(db.from("audit_events").select("*").order("created_at", { ascending: false }));
export const listTickets = () =>
  rows(db.from("support_tickets").select("*").order("created_at", { ascending: false }));

/* ------------------------------ field & clinical ------------------------------ */

export const listVisits = () =>
  rows(
    db
      .from("visit_reports")
      .select("*, farmers(name, region)")
      .order("submitted_at", { ascending: false }),
  );
export const listHealthCases = () =>
  rows(
    db
      .from("health_cases")
      .select("*, farmers(name, region)")
      .order("created_at", { ascending: false }),
  );
export const listNutritionPlans = () =>
  rows(db.from("nutrition_plans").select("*").order("created_at", { ascending: false }));

/** id → display name for staff, with a label for the demo account (seed rows bound to whoever signed in). */
export function staffNamer(users: Row[], me?: { id: string; name: string } | null) {
  const map = new Map(users.map((u) => [u.id as string, u.name as string]));
  return (id: string | null | undefined) =>
    !id ? "Unassigned" : (map.get(id) ?? (me && id === me.id ? `${me.name} (you)` : "Demo agent"));
}

export const updateRow = (table: string, id: string, patch: Row) =>
  run(db.from(table).update(patch).eq("id", id));
export const insertRow = (table: string, row: Row) => run(db.from(table).insert(row));
export const deleteRow = (table: string, id: string) => run(db.from(table).delete().eq("id", id));

/** Record an admin action in the audit trail and system log. */
export async function audit(
  actor: string,
  action: string,
  entity: string,
  target: string,
  change?: { field: string; from: unknown; to: unknown },
) {
  await insertRow("audit_events", {
    actor_name: actor,
    action,
    entity,
    target,
    field: change?.field ?? null,
    from: change?.from != null ? String(change.from) : null,
    to: change?.to != null ? String(change.to) : null,
    ip: "10.0.0.1",
  });
  await insertRow("system_logs", {
    level: "info",
    action: `${entity}.${action}`,
    entity,
    message: `${action[0]!.toUpperCase()}${action.slice(1)} ${entity.replace(/_/g, " ")}: ${target}`,
    actor_name: actor,
    meta: {},
  });
}

/** Signed-in user's display name, for audit entries. */
export function useActorName() {
  return useAuth().session?.user.name ?? "Unknown";
}

/* ------------------------------ formatting ------------------------------ */

export const naira = (n: number) =>
  `₦${Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

/** Compact naira for stat tiles and chart axes: ₦375K, ₦2.5M. */
export const nairaShort = (n: number) =>
  `₦${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(n))}`;

export const shortDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

export const dateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const productOptions = (products: Row[]) =>
  products.map((p) => ({ value: p.id as string, label: `${p.name} (${p.sku})` }));
export const warehouseOptions = WAREHOUSES.map((w) => ({ value: w, label: w }));
