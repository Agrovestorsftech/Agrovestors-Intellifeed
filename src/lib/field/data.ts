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
// - There is no farmers list endpoint yet (backend requirements R4), so the
//   Farmers page lists assigned farms; the farmer's own name isn't available.

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

  const [visits, farms] = await Promise.all([listAll<ApiVisit>("/farms/visits/"), fetchMyFarms()]);
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

export function createVisit(v: NewVisit): Promise<ApiVisit> {
  return api.post<ApiVisit>("/farms/visits/", {
    farm_id: v.farmId,
    visit_type: v.visitType,
    visit_date: v.visitDate,
    summary: v.summary.trim() || null,
    next_visit_date: v.nextVisitDate || null,
  });
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

  const farms = await fetchMyFarms();
  return farms.map((f) => ({
    id: f.id,
    // No farmer name in the farm list yet (backend R4): show the farm.
    name: f.name,
    farm_name: f.name,
    region: regionOf(f),
    phone: null,
    livestock_type: f.primary_species?.name ?? f.primary_category?.name ?? null,
    status: f.is_active ? "active" : "inactive",
    avatar_url: null,
    notes: null,
    // The backend only returns farms assigned to this agent.
    assigned_agent_id: currentUserId ?? null,
  }));
}
