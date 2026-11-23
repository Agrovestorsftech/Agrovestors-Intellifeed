// Field Agent data, switched by AUTH_MODE.
//
// - demo: the in-memory mock store (src/lib/mock).
// - api: the IntelliFeed360 backend (apps/farms). Results are converted to the
//   row shapes the pages already render, so page markup stays the same.
//
// Backend notes (intellifeed360_backend_api):
// - GET /farms/ returns only the farms the signed-in agent is assigned to.
// - GET /farms/visits/ returns only that agent's visits. A visit has a date,
//   type and summary but no review status, so api rows are "upcoming" or
//   "completed" by date.
// - GET /farmers/ (the farmer directory) returns the owners of the agent's
//   assigned farms, with phone and email. The Farmers page stays one card per
//   farm and takes the owner's name and contacts from it.

import { AUTH_MODE } from "@/lib/auth/AuthContext";
import { API_BASE_URL, api, type Page } from "@/lib/api/client";
import { mockDb as db } from "@/lib/mock/db";

export const IS_API = AUTH_MODE === "api";

// --- Backend shapes (apps/farms/serializers.py) ---------------------------

interface Named {
  id: string | number;
  name: string;
}

export interface ApiFarm {
  id: string;
  name: string;
  state: Named | null;
  lga: Named | null;
  environment_type: string | null;
  primary_category: Named | null;
  primary_species: Named | null;
  is_active: boolean;
  created_at: string;
}

export type VisitType = "physical" | "virtual" | "whatsapp";

export interface ApiVisit {
  id: string;
  farm: { id: string; name: string; environment_type: string | null };
  visit_type: VisitType;
  visit_date: string; // YYYY-MM-DD
  summary: string | null;
  action_items: unknown;
  next_visit_date: string | null;
  created_at: string;
}

// --- Row shapes the pages render -------------------------------------------

export interface VisitRow {
  id: string;
  species: string | null;
  priority?: string | null;
  status: string;
  summary: string | null;
  submitted_at: string;
  farmers: { name?: string | null; farm_name: string | null; region: string | null } | null;
}

export interface FarmerRow {
  id: string;
  name: string;
  farm_name: string | null;
  region: string | null;
  phone: string | null;
  email?: string | null;
  livestock_type: string | null;
  status: string;
  avatar_url: string | null;
  notes: string | null;
  assigned_agent_id: string | null;
}

// --- Helpers ----------------------------------------------------------------

/** Fetch every page of a DRF list. `next` links are absolute, so keep only
 * the part after the API base to stay on the dev proxy. */
async function listAll<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = `${path}${path.includes("?") ? "&" : "?"}page_size=100`;
  for (let guard = 0; next && guard < 20; guard++) {
    const page: Page<T> | T[] = await api.get<Page<T> | T[]>(next);
    if (Array.isArray(page)) return page;
    out.push(...page.results);
    next = page.next ? toApiPath(page.next) : null;
  }
  return out;
}

function toApiPath(url: string): string {
  const marker = "/api/v1";
  const i = url.indexOf(marker);
  if (i >= 0) return url.slice(i + marker.length);
  return url.startsWith(API_BASE_URL) ? url.slice(API_BASE_URL.length) : url;
}

function regionOf(f: Pick<ApiFarm, "state" | "lga"> | undefined): string | null {
  if (!f) return null;
  return [f.lga?.name, f.state?.name].filter(Boolean).join(", ") || null;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const VISIT_TYPE_LABEL: Record<VisitType, string> = {
  physical: "On-farm",
  virtual: "Video call",
  whatsapp: "WhatsApp",
};

// --- Farms ------------------------------------------------------------------

export function fetchMyFarms(): Promise<ApiFarm[]> {
  return listAll<ApiFarm>("/farms/");
}

// --- Visits -----------------------------------------------------------------

export async function fetchMyVisitRows(userId: string, limit?: number): Promise<VisitRow[]> {
  if (!IS_API) {
    let q = db
      .from("visit_reports")
      .select(
        "id, species, priority, status, summary, submitted_at, farmers(name, farm_name, region)",
      )
      .eq("agent_id", userId)
      .order("submitted_at", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as VisitRow[];
  }

  const { visits, farms } = await loadVisitsAndFarms();
  const farmById = new Map(farms.map((f) => [f.id, f]));
  const today = todayKey();
  const rows = visits
    .map((v): VisitRow => {
      const farm = farmById.get(v.farm.id);
      return {
        id: v.id,
        species: farm?.primary_species?.name ?? VISIT_TYPE_LABEL[v.visit_type] ?? v.visit_type,
        status: v.visit_date > today ? "upcoming" : "completed",
        summary: v.summary,
        // visit_date is a calendar date; noon local keeps it on that day in any zone.
        submitted_at: new Date(`${v.visit_date}T12:00:00`).toISOString(),
        farmers: { farm_name: v.farm.name, region: regionOf(farm) },
      };
    })
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  return limit ? rows.slice(0, limit) : rows;
}

export interface NewVisit {
  farmId: string;
  visitType: VisitType;
  visitDate: string; // YYYY-MM-DD
  summary: string;
  nextVisitDate?: string;
}

export async function createVisit(v: NewVisit): Promise<ApiVisit> {
  const created = await api.post<ApiVisit>("/farms/visits/", {
    farm_id: v.farmId,
    visit_type: v.visitType,
    visit_date: v.visitDate,
    summary: v.summary.trim() || null,
    next_visit_date: v.nextVisitDate || null,
  });
  visitsCache = null;
  return created;
}

// --- Shared load ------------------------------------------------------------
// The dashboard asks for today, this week and a summary at once; one short-lived
// cache keeps that to a single pair of requests.

let visitsCache: { at: number; data: Promise<{ visits: ApiVisit[]; farms: ApiFarm[] }> } | null =
  null;
const CACHE_MS = 20_000;

function loadVisitsAndFarms(): Promise<{ visits: ApiVisit[]; farms: ApiFarm[] }> {
  if (visitsCache && Date.now() - visitsCache.at < CACHE_MS) return visitsCache.data;
  const data = Promise.all([listAll<ApiVisit>("/farms/visits/"), fetchMyFarms()]).then(
    ([visits, farms]) => ({
      visits,
      farms,
    }),
  );
  data.catch(() => {
    visitsCache = null;
  });
  visitsCache = { at: Date.now(), data };
  return data;
}

// --- Schedule ---------------------------------------------------------------
// The backend has no schedule table, so it is derived from visits:
// - each visit is a completed item on its visit_date;
// - the latest visit per farm plans the next one (next_visit_date): due today,
//   upcoming, or missed once the date has passed with no newer visit.

export type ScheduleStatus = "Completed" | "Missed" | "Upcoming" | "Due";

export interface ApiScheduleItem {
  id: string;
  farmId: string;
  farm: string;
  region: string;
  species: string;
  purpose: string;
  /** ISO instant at local noon of the calendar date. */
  at: string;
  day: string; // YYYY-MM-DD
  time: string;
  status: ScheduleStatus;
}

const noonIso = (day: string) => new Date(`${day}T12:00:00`).toISOString();

function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function allScheduleItems(): Promise<{ items: ApiScheduleItem[]; farms: ApiFarm[] }> {
  const { visits, farms } = await loadVisitsAndFarms();
  const farmById = new Map(farms.map((f) => [f.id, f]));
  const today = todayKey();
  const describe = (farmId: string, fallbackName: string) => {
    const f = farmById.get(farmId);
    return {
      farm: f?.name ?? fallbackName,
      region: regionOf(f) ?? "—",
      species: f?.primary_species?.name ?? f?.primary_category?.name ?? "Other",
    };
  };

  const items: ApiScheduleItem[] = visits.map((v) => ({
    id: v.id,
    farmId: v.farm.id,
    ...describe(v.farm.id, v.farm.name),
    purpose:
      v.summary?.split("\n")[0]?.slice(0, 80) || VISIT_TYPE_LABEL[v.visit_type] || "Farm visit",
    at: noonIso(v.visit_date),
    day: v.visit_date,
    time: "All day",
    status: v.visit_date > today ? "Upcoming" : "Completed",
  }));

  const latestByFarm = new Map<string, ApiVisit>();
  for (const v of visits) {
    const cur = latestByFarm.get(v.farm.id);
    if (!cur || v.visit_date > cur.visit_date) latestByFarm.set(v.farm.id, v);
  }
  for (const v of latestByFarm.values()) {
    const next = v.next_visit_date;
    if (!next || next <= v.visit_date) continue;
    items.push({
      id: `${v.id}:next`,
      farmId: v.farm.id,
      ...describe(v.farm.id, v.farm.name),
      purpose: "Follow-up visit",
      at: noonIso(next),
      day: next,
      time: "All day",
      status: next > today ? "Upcoming" : next === today ? "Due" : "Missed",
    });
  }

  items.sort((a, b) => a.day.localeCompare(b.day));
  return { items, farms };
}

/** Schedule items whose calendar day falls in [from, to). */
export async function fetchApiSchedule(from: Date, to: Date): Promise<ApiScheduleItem[]> {
  const { items } = await allScheduleItems();
  const fromKey = dayKeyOf(from);
  const toKey = dayKeyOf(to);
  return items.filter((i) => i.day >= fromKey && i.day < toKey);
}

// --- Dashboard KPIs ---------------------------------------------------------

async function countReports(status: "submitted" | "flagged"): Promise<number> {
  const page = await api.get<Page<unknown>>(`/reports/?status=${status}&page_size=1`);
  return page?.count ?? 0;
}

export async function fetchApiFieldKpis(
  today: { from: Date; to: Date },
  week: { from: Date; to: Date },
) {
  const [{ farms }, todayItems, weekItems, pendingReports, urgentAlerts] = await Promise.all([
    loadVisitsAndFarms(),
    fetchApiSchedule(today.from, today.to),
    fetchApiSchedule(week.from, week.to),
    countReports("submitted"),
    countReports("flagged"),
  ]);
  return {
    assigned: farms.length,
    todayVisits: todayItems.length,
    doneToday: todayItems.filter((v) => v.status === "Completed").length,
    pendingReports,
    completedThisWeek: weekItems.filter((v) => v.status === "Completed").length,
    urgentAlerts,
  };
}

// --- Performance ------------------------------------------------------------

export async function fetchApiPerformance(weekStart: Date, weeks: number, target: number) {
  const { items, farms } = await allScheduleItems();
  const from = new Date(weekStart);
  from.setDate(from.getDate() - (weeks - 1) * 7);
  const now = new Date();
  const todayK = dayKeyOf(now);
  const since30K = dayKeyOf(new Date(now.getTime() - 30 * 86_400_000));
  const past = items.filter((i) => i.day >= dayKeyOf(from) && i.day <= todayK);

  const weekly = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(from);
    start.setDate(from.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const inWeek = past.filter((v) => v.day >= dayKeyOf(start) && v.day < dayKeyOf(end));
    return {
      week: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      completed: inWeek.filter((v) => v.status === "Completed").length,
      missed: inWeek.filter((v) => v.status === "Missed").length,
    };
  });

  const last30 = past.filter((v) => v.day >= since30K);
  const done30 = last30.filter((v) => v.status === "Completed");
  const missed30 = last30.filter((v) => v.status === "Missed").length;
  const completionRate =
    done30.length + missed30 ? Math.round((done30.length / (done30.length + missed30)) * 100) : 0;

  const tally = (key: "species" | "region") => {
    const m: Record<string, number> = {};
    for (const v of done30) m[v[key]] = (m[v[key]] ?? 0) + 1;
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const doneDays = new Set(items.filter((v) => v.status === "Completed").map((v) => v.day));
  let streak = 0;
  const cursor = new Date();
  if (!doneDays.has(dayKeyOf(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (doneDays.has(dayKeyOf(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    weekly,
    thisWeek: weekly[weekly.length - 1]?.completed ?? 0,
    target,
    completionRate,
    // Backend visits aren't approved or rejected, so there is no approval rate.
    approvalRate: null as number | null,
    reviewedCount: 0,
    farmsCovered: new Set(done30.map((v) => v.farmId)).size,
    assigned: farms.length,
    bySpecies: tally("species"),
    byRegion: tally("region"),
    streak,
    // Agents can only see their own visits, so the ranking is just "you".
    leaderboard: [{ id: "me", name: "You", value: done30.length, me: true }],
  };
}

// --- Farmers ----------------------------------------------------------------

export async function fetchFarmerRows(currentUserId?: string): Promise<FarmerRow[]> {
  if (!IS_API) {
    const { data, error } = await db
      .from("farmers")
      .select(
        "id, name, farm_name, region, phone, livestock_type, status, avatar_url, notes, assigned_agent_id",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as FarmerRow[];
  }

  // The directory only adds names and contacts, so if it fails the page still
  // lists the farms (under the farm name) rather than showing nothing.
  const [farms, farmers] = await Promise.all([
    fetchMyFarms(),
    listAll<ApiFarmer>("/farmers/").catch(() => [] as ApiFarmer[]),
  ]);
  const ownerOf = new Map<string, ApiFarmer>();
  for (const farmer of farmers) {
    for (const farm of farmer.farms) ownerOf.set(farm.id, farmer);
  }
  return farms.map((f) => {
    const owner = ownerOf.get(f.id);
    return {
      id: f.id,
      name: owner ? farmerName(owner) : f.name,
      farm_name: f.name,
      region: regionOf(f),
      phone: owner?.phone ?? null,
      email: owner?.email ?? null,
      livestock_type: f.primary_species?.name ?? f.primary_category?.name ?? null,
      status: f.is_active ? "active" : "inactive",
      avatar_url: owner?.avatar_url ?? null,
      notes: null,
      // The backend only returns farms assigned to this agent.
      assigned_agent_id: currentUserId ?? null,
    };
  });
}

/** apps/accounts/farmers.py — only the fields used here. */
interface ApiFarmer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  farms: { id: string }[];
}

function farmerName(f: ApiFarmer): string {
  return (
    f.full_name?.trim() ||
    [f.first_name, f.last_name].filter(Boolean).join(" ").trim() ||
    f.email ||
    "Farmer"
  );
}

// --- Feed orders --------------------------------------------------------------
// GET /products/orders/ returns orders on the agent's assigned farms, with
// their line items. Agents place orders (POST /products/orders/) for assigned
// farms: products and bags only. FeedOps prices, confirms, dispatches and
// delivers them; agents can't do any of that.

type ApiOrderItem = {
  product: { name: string; bag_size_kg: string } | null;
  quantity_bags: number;
};

interface ApiOrderListItem {
  id: string;
  order_code: string;
  farm?: { id: string; name: string } | null;
  status: string;
  order_date: string;
  total_ngn: string;
  created_at: string;
  // In the list since the backend's FeedOps work; older deployments omit it.
  items?: ApiOrderItem[];
}

interface ApiOrderDetail extends ApiOrderListItem {
  items: ApiOrderItem[];
}

/** apps/products FeedProductSerializer — only the fields used here. */
export interface FeedProductOption {
  id: string;
  product_code: string;
  name: string;
  bag_size_kg: string | null;
}

/** Products that can be ordered now. */
export function fetchOrderableProducts(): Promise<FeedProductOption[]> {
  return listAll<FeedProductOption>("/products/feed/?is_available=true");
}

/** apps/batches BatchListSerializer — only the fields used here. */
export interface BatchOption {
  id: string;
  batch_code: string;
  species: Named | null;
  current_stock: number | null;
}

/** A farm's active batches. Every order is for a batch: the backend's API
 * marks the batch optional, but its database requires one. */
export function fetchActiveBatches(farmId: string): Promise<BatchOption[]> {
  return listAll<BatchOption>(`/batches/?farm=${encodeURIComponent(farmId)}&status=active`);
}

export interface NewOrder {
  farmId: string;
  batchId: string;
  productId: string;
  bags: number;
  notes: string;
}

/** Place an order for a batch on an assigned farm. The backend sets the price
 * when FeedOps confirms it. */
export function placeOrder(o: NewOrder) {
  return api.post("/products/orders/", {
    farm_id: o.farmId,
    batch_id: o.batchId,
    items: [{ product_id: o.productId, quantity_bags: o.bags }],
    notes: o.notes.trim(),
  });
}

export interface OrderRow {
  id: string;
  order_no: string;
  quantity: number | string;
  status: string;
  placed_at: string;
  farmers: { farm_name: string | null } | null;
  feed_products: { name: string | null; unit: string | null } | null;
}

/** Backend order status -> the status words the page already understands. */
const ORDER_STATUS: Record<string, string> = {
  draft: "pending",
  placed: "pending",
  confirmed: "processing",
  dispatched: "out_for_delivery",
  delivered: "delivered",
  cancelled: "cancelled",
};

const MAX_ORDER_DETAILS = 20;

export async function fetchMyOrderRows(userId: string): Promise<OrderRow[]> {
  if (!IS_API) {
    const { data, error } = await db
      .from("feed_orders")
      .select(
        "id, order_no, quantity, status, placed_at, farmers(name, farm_name), feed_products(name, unit)",
      )
      .eq("agent_id", userId)
      .order("placed_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as OrderRow[];
  }

  const page = await api.get<Page<ApiOrderListItem>>(
    `/products/orders/?page_size=${MAX_ORDER_DETAILS}`,
  );
  // Only an older backend without items in the list needs a call per order.
  const details = await Promise.all(
    page.results.map((o) =>
      o.items
        ? ({ ...o, items: o.items } as ApiOrderDetail)
        : api.get<ApiOrderDetail>(`/products/orders/${o.id}/`).catch(() => null),
    ),
  );
  return page.results.map((o, i) => {
    const items = details[i]?.items ?? [];
    const first = items[0]?.product?.name ?? null;
    const bags = items.reduce((n, it) => n + (it.quantity_bags ?? 0), 0);
    return {
      id: o.id,
      order_no: o.order_code,
      quantity: details[i] ? bags : "—",
      status: ORDER_STATUS[o.status] ?? o.status,
      placed_at: o.created_at,
      farmers: { farm_name: o.farm?.name ?? null },
      feed_products: {
        name: first ? (items.length > 1 ? `${first} +${items.length - 1} more` : first) : null,
        unit: details[i] ? "bags" : "",
      },
    };
  });
}
