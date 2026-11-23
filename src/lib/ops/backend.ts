// FeedOps data from the IntelliFeed360 backend (apps.feedops, apps.products),
// mapped to the row shapes the FeedOps pages already render. Used by
// src/lib/ops/api.ts when AUTH_MODE is "api".
//
// Warehouses are passed around by name (names are unique on the backend) and
// resolved to ids here, so pages keep working with plain names.
// Stock is counted in bags; production rows also expose `quantity` in kg
// (bags x the product's bag size) because the pages show kg and tonnes.

import { api, fetchAllPages } from "@/lib/api/client";

type Row = Record<string, any>;

interface Named {
  id: string;
  name: string;
}

interface ApiProduct {
  id: string;
  product_code: string;
  name: string;
  bag_size_kg: string;
  category?: Named | null;
  is_available?: boolean;
}

// --- Lookups ----------------------------------------------------------------

let warehouseCache: { at: number; data: Promise<(Named & { is_active: boolean })[]> } | null = null;

export function listWarehouses(fresh = false) {
  if (!fresh && warehouseCache && Date.now() - warehouseCache.at < 30_000)
    return warehouseCache.data;
  const data = fetchAllPages<Named & { is_active: boolean }>("/feedops/warehouses/");
  data.catch(() => (warehouseCache = null));
  warehouseCache = { at: Date.now(), data };
  return data;
}

export async function warehouseNames(): Promise<string[]> {
  return (await listWarehouses()).filter((w) => w.is_active).map((w) => w.name);
}

async function warehouseId(name: string): Promise<string> {
  const match = (await listWarehouses()).find((w) => w.name === name);
  if (!match) throw new Error(`Warehouse "${name}" was not found. Reload the page and try again.`);
  return match.id;
}

const productRow = (p: ApiProduct): Row => ({
  id: p.id,
  name: p.name,
  sku: p.product_code,
  unit: "bag",
  category: p.category?.name ?? null,
  bag_size_kg: Number(p.bag_size_kg),
  // The backend has no list prices: orders are priced when FeedOps confirms them.
  price_per_unit: null,
});

export async function listProducts(): Promise<Row[]> {
  return (await fetchAllPages<ApiProduct>("/products/feed/"))
    .map(productRow)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// --- Inventory ----------------------------------------------------------------

export async function listInventory(): Promise<Row[]> {
  const levels = await fetchAllPages<Row>("/feedops/stock/");
  return levels.map((l) => ({
    id: l.id,
    product_id: l.product.id,
    warehouse: l.warehouse.name,
    quantity: l.quantity_bags,
    reorder_level: l.reorder_level,
    updated_at: l.updated_at,
    feed_products: productRow(l.product),
  }));
}

/** Bags in (positive) or out (negative). Positive changes are receipts. */
export async function adjustStock(
  productId: string,
  warehouse: string,
  delta: number,
  reason = "",
) {
  await api.post("/feedops/stock/adjust/", {
    warehouse_id: await warehouseId(warehouse),
    product_id: productId,
    change_bags: delta,
    kind: delta > 0 ? "receipt" : "adjustment",
    reason,
  });
}

export const setReorderLevel = (id: string, level: number) =>
  api.patch(`/feedops/stock/${id}/`, { reorder_level: level });

// --- Production and quality ---------------------------------------------------

const RUN_STATUS: Record<string, string> = {
  planned: "queued",
  in_progress: "running",
  awaiting_qc: "completed",
  released: "completed",
  rejected: "completed",
  cancelled: "cancelled",
};

const runRow = (r: Row): Row => {
  const bagKg = Number(r.product?.bag_size_kg ?? 25);
  const bags = r.produced_bags ?? r.planned_bags;
  return {
    id: r.id,
    batch_no: r.code,
    product_id: r.product?.id,
    quantity: bags * bagKg, // kg, as the pages expect
    bags,
    status: RUN_STATUS[r.status] ?? r.status,
    backend_status: r.status, // planned | in_progress | awaiting_qc | released | rejected | cancelled
    warehouse: r.warehouse?.name ?? null,
    started_at: r.started_at,
    finished_at: r.finished_at,
    created_at: r.created_at,
    feed_products: { name: r.product?.name, unit: "bag" },
  };
};

export async function listProduction(): Promise<Row[]> {
  return (await fetchAllPages<Row>("/feedops/production/")).map(runRow);
}

export async function createBatch(v: {
  product_id: string;
  quantity: number;
  warehouse: string;
  bagKg?: number;
}) {
  await api.post("/feedops/production/", {
    product_id: v.product_id,
    warehouse_id: await warehouseId(v.warehouse),
    planned_bags: Math.max(1, Math.round(v.quantity / (v.bagKg || 25))),
  });
}

export const startBatch = (id: string) => api.post(`/feedops/production/${id}/start/`);
export const cancelBatch = (id: string) => api.post(`/feedops/production/${id}/cancel/`);

/** Finish a run. Its bags enter stock only after a passing quality check. */
export const completeBatch = (run: Row) =>
  api.post(`/feedops/production/${run.id}/complete/`, {
    produced_bags: run.bags ?? Math.round(run.quantity / 25),
  });

export async function listQualityChecks(): Promise<Row[]> {
  const [checks, waiting] = await Promise.all([
    fetchAllPages<Row>("/feedops/quality-checks/"),
    fetchAllPages<Row>("/feedops/production/?status=awaiting_qc"),
  ]);
  const runs = new Map((await listProduction()).map((r) => [r.id, r]));
  const pending = waiting.map((r) => ({
    id: r.id, // a run awaiting its check: record the check on this run
    run_id: r.id,
    batch_no: r.code,
    product_id: r.product?.id,
    feed_products: { name: r.product?.name },
    result: "pending",
    moisture: null,
    protein: null,
    aflatoxin: null,
    inspector: null,
    notes: null,
    checked_at: null,
    created_at: r.finished_at ?? r.created_at,
  }));
  const done = checks.map((c) => ({
    id: c.id,
    run_id: c.run.id,
    batch_no: c.run.code,
    product_id: runs.get(c.run.id)?.product_id,
    feed_products: { name: runs.get(c.run.id)?.feed_products?.name ?? null },
    result: c.result,
    moisture: Number(c.moisture_pct),
    protein: Number(c.protein_pct),
    aflatoxin: Number(c.aflatoxin_ppb),
    inspector: c.inspector,
    notes: c.notes || null,
    checked_at: c.created_at,
    created_at: c.created_at,
  }));
  return [...pending, ...done];
}

/** Record a check on a run awaiting it; returns "pass" or "fail". */
export async function recordQualityCheck(v: {
  id?: string;
  run_id?: string;
  moisture: number;
  protein: number;
  aflatoxin: number;
  notes?: string;
}) {
  const runId = v.run_id ?? v.id;
  const res = await api.post<Row>(`/feedops/production/${runId}/quality-checks/`, {
    moisture_pct: v.moisture.toFixed(2),
    protein_pct: v.protein.toFixed(2),
    aflatoxin_ppb: v.aflatoxin.toFixed(2),
    notes: v.notes ?? "",
  });
  return res.result as "pass" | "fail";
}

// --- Orders and deliveries ----------------------------------------------------

const ORDER_STATUS: Record<string, string> = {
  draft: "pending",
  placed: "pending",
  confirmed: "processing",
  dispatched: "out_for_delivery",
  delivered: "delivered",
  cancelled: "cancelled",
};

const orderRow = (o: Row): Row => {
  const items: Row[] = o.items ?? [];
  const bags = items.reduce((n, i) => n + (i.quantity_bags ?? 0), 0);
  const first = items[0]?.product;
  const total = Number(o.total_ngn ?? 0);
  return {
    id: o.id,
    order_no: o.order_code,
    quantity: bags,
    status: ORDER_STATUS[o.status] ?? o.status,
    backend_status: o.status,
    placed_at: o.created_at,
    total,
    items: items.map((i) => ({ id: i.id, product: i.product?.name, bags: i.quantity_bags })),
    farmers: { name: o.farm?.name ?? null, farm_name: o.farm?.name ?? null, region: null },
    feed_products: {
      name: first
        ? items.length > 1
          ? `${first.name} +${items.length - 1} more`
          : first.name
        : null,
      unit: "bag",
      price_per_unit: bags && total ? total / bags : null,
    },
  };
};

export async function listOrders(): Promise<Row[]> {
  return (await fetchAllPages<Row>("/products/orders/")).map(orderRow);
}

/** Price each item (₦ per bag) and confirm the order. */
export async function confirmOrder(
  orderId: string,
  pricePerBag: Record<string, number>,
  expectedDelivery: string,
  deliveryFee = 0,
) {
  await api.post(`/products/orders/${orderId}/confirm/`, {
    prices: Object.fromEntries(Object.entries(pricePerBag).map(([k, v]) => [k, v.toFixed(2)])),
    delivery_fee_ngn: deliveryFee.toFixed(2),
    expected_delivery: expectedDelivery,
  });
}

export const cancelOrder = (orderId: string) => api.post(`/products/orders/${orderId}/cancel/`);

const deliveryRow = (d: Row, ordersById: Map<string, Row>): Row => ({
  id: d.id,
  order_id: d.order.id,
  driver: d.driver_name,
  vehicle: d.vehicle,
  warehouse: d.warehouse?.name ?? null,
  region: null,
  scheduled_for: `${d.scheduled_for}T09:00:00`,
  delivered_at: d.delivered_at,
  status: d.status,
  created_at: d.created_at,
  order: ordersById.get(d.order.id) ?? {
    id: d.order.id,
    order_no: d.order.order_code,
    farmers: { farm_name: d.order.farm?.name ?? null },
  },
});

export async function listDeliveries(): Promise<Row[]> {
  const [deliveries, orders] = await Promise.all([
    fetchAllPages<Row>("/feedops/deliveries/"),
    listOrders(),
  ]);
  const byId = new Map(orders.map((o) => [o.id, o]));
  return deliveries.map((d) => deliveryRow(d, byId));
}

export async function scheduleDelivery(v: {
  order_id: string;
  driver: string;
  vehicle: string;
  scheduled_for: string;
  warehouse: string;
}) {
  await api.post("/feedops/deliveries/", {
    order_id: v.order_id,
    warehouse_id: await warehouseId(v.warehouse),
    scheduled_for: v.scheduled_for.slice(0, 10),
    driver_name: v.driver,
    vehicle: v.vehicle,
  });
}

export async function setDeliveryStatus(d: Row, status: "in_transit" | "delivered" | "failed") {
  const action = { in_transit: "dispatch", delivered: "delivered", failed: "failed" }[status];
  await api.post(`/feedops/deliveries/${d.id}/${action}/`, {});
}

/** "Mark delivered" from the orders page: completes the order's delivery. */
export async function deliverOrder(orderId: string) {
  const deliveries = await fetchAllPages<Row>("/feedops/deliveries/?status=in_transit");
  const match = deliveries.find((d) => d.order.id === orderId);
  if (!match)
    throw new Error("Schedule and dispatch a delivery for this order first (Deliveries page).");
  await api.post(`/feedops/deliveries/${match.id}/delivered/`, {});
}

// --- Stock transfers ----------------------------------------------------------

const TRANSFER_ROW = (t: Row): Row => ({
  id: t.id,
  ref: t.code,
  product_id: t.product?.id,
  from_warehouse: t.from_warehouse?.name,
  to_warehouse: t.to_warehouse?.name,
  quantity: t.bags,
  status: t.status,
  requested_by: t.requested_by,
  requested_at: t.created_at,
  created_at: t.created_at,
  feed_products: { name: t.product?.name, unit: "bag" },
});

export async function listTransfers(): Promise<Row[]> {
  return (await fetchAllPages<Row>("/feedops/transfers/")).map(TRANSFER_ROW);
}

export async function requestTransfer(v: {
  product_id: string;
  from_warehouse: string;
  to_warehouse: string;
  quantity: number;
}) {
  await api.post("/feedops/transfers/", {
    product_id: v.product_id,
    from_warehouse_id: await warehouseId(v.from_warehouse),
    to_warehouse_id: await warehouseId(v.to_warehouse),
    bags: v.quantity,
  });
}

export const dispatchTransfer = (t: Row) => api.post(`/feedops/transfers/${t.id}/dispatch/`);
export const receiveTransfer = (t: Row) => api.post(`/feedops/transfers/${t.id}/receive/`);
export const cancelTransfer = (id: string) => api.post(`/feedops/transfers/${id}/cancel/`);

// --- Suppliers ----------------------------------------------------------------

const supplierRow = (s: Row): Row => ({
  id: s.id,
  name: s.name,
  category: s.category,
  region: s.state?.name ?? null,
  contact_name: s.contact_name,
  phone: s.phone,
  email: s.email,
  rating: s.rating,
  status: s.status,
  last_order_at: s.last_order_at,
  created_at: s.created_at,
});

export async function listSuppliers(): Promise<Row[]> {
  return (await fetchAllPages<Row>("/feedops/suppliers/")).map(supplierRow);
}

/** Create or update; `region` (a state name on the dashboard) is not sent. */
export async function saveSupplier(v: Row, id?: string) {
  const { name, category, contact_name, phone, email, rating, status, notes } = v;
  const payload = Object.fromEntries(
    Object.entries({ name, category, contact_name, phone, email, rating, status, notes }).filter(
      ([, x]) => x !== undefined,
    ),
  );
  if (id) await api.patch(`/feedops/suppliers/${id}/`, payload);
  else await api.post("/feedops/suppliers/", payload);
}

export const setSupplierStatus = (id: string, status: string) =>
  api.patch(`/feedops/suppliers/${id}/`, { status });
export const recordSupplierOrder = (id: string) =>
  api.post(`/feedops/suppliers/${id}/record-order/`);
