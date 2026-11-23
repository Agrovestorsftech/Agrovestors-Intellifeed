// Admin Agent (nutritionist / vet) data from the IntelliFeed360 backend,
// mapped to the row shapes the agent pages render. Used in api mode only;
// every page keeps its demo query otherwise.
//
// Live sources (all deployed on the testing API):
//   /reports/                        farmer batch reports (from the farmer app)
//   /batches/                        batch -> farm, species, stock
//   /ration/plans/                   nutrition (ration) plans per batch
//   /intelligence/signals/           health signals (system/AI generated)
//   /intelligence/rescue-protocols/  rescue plans for at-risk batches
// Not yet deployed: POST /reports/{id}/review/ (backend PR) and
// /support/tickets/ (backend PR #20); those calls fail until then.

import { ApiError, api, fetchAllPages } from "@/lib/api/client";

type Row = Record<string, any>;

// --- Shared batch lookup --------------------------------------------------------

interface BatchInfo {
  farm: string | null;
  farmId: string | null;
  species: string | null;
  stock: number | null;
}

let batchCache: { at: number; data: Promise<Map<string, BatchInfo>> } | null = null;

function batches(): Promise<Map<string, BatchInfo>> {
  if (batchCache && Date.now() - batchCache.at < 30_000) return batchCache.data;
  const data = fetchAllPages<Row>("/batches/").then(
    (rows) =>
      new Map(
        rows.map((b) => [
          b.id,
          {
            farm: b.farm?.name ?? null,
            farmId: b.farm?.id ?? null,
            species: b.species?.name ?? b.category?.name ?? null,
            stock: b.current_stock ?? null,
          },
        ]),
      ),
  );
  data.catch(() => (batchCache = null));
  batchCache = { at: Date.now(), data };
  return data;
}

const farmOf = (info: BatchInfo | undefined, name?: string | null) => ({
  name: name ?? info?.farm ?? null,
  farm_name: info?.farm ?? null,
  livestock_type: info?.species ?? null,
});

const HEALTH_SIGNALS = new Set(["health_status", "risk_flag", "visual_health"]);

// --- Farmer reports (Reports Review) ------------------------------------------------

const REPORT_STATUS: Record<string, string> = {
  submitted: "pending",
  reviewed: "approved",
  flagged: "rejected",
};

function reportPriority(r: Row): string {
  const alive = Number(r.stock_alive || 0);
  const deaths = Number(r.mortality_since_last || 0);
  const rate = alive + deaths ? deaths / (alive + deaths) : 0;
  if (r.appearance === "concerning" || rate >= 0.05) return "high";
  if (r.appearance === "lethargic" || r.appearance === "mixed" || rate >= 0.02) return "medium";
  return "normal";
}

export async function fetchReviewReports(): Promise<Row[]> {
  const [reports, info] = await Promise.all([fetchAllPages<Row>("/reports/"), batches()]);
  return reports.map((r) => {
    const b = info.get(r.batch?.id);
    return {
      id: r.id,
      species: b?.species ?? null,
      priority: reportPriority(r),
      status: REPORT_STATUS[r.status] ?? r.status,
      backend_status: r.status,
      summary: `Cycle ${r.cycle_number}: ${r.stock_alive} alive, ${r.mortality_since_last} died since last report, animals ${String(r.appearance).replace("_", " ")}.`,
      submitted_at: r.created_at,
      reviewed_at: null,
      farmers: { name: r.submitted_by_name, farm_name: b?.farm ?? r.batch?.batch_code ?? null },
      batch_code: r.batch?.batch_code ?? null,
    };
  });
}

/** approved -> reviewed, rejected -> flagged. */
export async function reviewReport(id: string, status: "approved" | "rejected", notes = "") {
  try {
    await api.post(`/reports/${id}/review/`, {
      status: status === "approved" ? "reviewed" : "flagged",
      review_notes: notes,
    });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      throw new Error(
        "Reviewing farmer reports needs the latest backend update, which isn't deployed yet.",
      );
    }
    throw err;
  }
}

// --- Nutrition (ration) plans ------------------------------------------------------

const PLAN_STATUS: Record<string, string> = {
  pending: "draft",
  active: "active",
  superseded: "archived",
  expired: "archived",
};
const PLAN_STATUS_BACK: Record<string, string> = {
  draft: "pending",
  active: "active",
  archived: "superseded",
};

export async function fetchNutritionPlans(): Promise<Row[]> {
  const [plans, info] = await Promise.all([fetchAllPages<Row>("/ration/plans/"), batches()]);
  return plans.map((p) => {
    const b = info.get(p.batch?.id);
    const kg = (x: unknown) => (x == null ? "?" : Number(x).toFixed(1));
    const split = `${kg(p.daily_qty_kg)} kg/day (morning ${kg(p.morning_qty_kg)}, afternoon ${kg(p.afternoon_qty_kg)}, evening ${kg(p.evening_qty_kg)})`;
    return {
      id: p.id,
      species: b?.species ?? null,
      status: PLAN_STATUS[p.status] ?? p.status,
      effective_from: p.valid_from,
      created_at: p.created_at,
      plan: {
        notes: [p.stage_label, split, p.rationale || p.farmer_summary].filter(Boolean).join(" · "),
      },
      farmers: farmOf(b),
    };
  });
}

export async function setPlanStatus(id: string, status: string) {
  await api.patch(`/ration/plans/${id}/`, { status: PLAN_STATUS_BACK[status] ?? status });
}

// --- Health signals (Health Assessments) ---------------------------------------------

const SEVERITY: Record<string, string> = { good: "low", monitor: "medium", act_now: "high" };

export async function fetchHealthSignals(): Promise<Row[]> {
  const [signals, info] = await Promise.all([
    fetchAllPages<Row>("/intelligence/signals/"),
    batches(),
  ]);
  return signals
    .filter((s) => HEALTH_SIGNALS.has(s.signal_type))
    .map((s) => ({
      id: s.id,
      severity: SEVERITY[s.severity] ?? s.severity,
      status: s.is_dismissed ? "resolved" : "open",
      diagnosis: s.title,
      treatment: s.farmer_message,
      created_at: s.created_at,
      farmers: farmOf(info.get(s.batch?.id)),
    }));
}

/** Signals can be dismissed (resolved) or restored (open); there is no in-progress state. */
export async function setSignalStatus(id: string, status: string) {
  if (status === "in_progress")
    throw new Error("Health signals are either open or resolved on the live system.");
  await api.patch(`/intelligence/signals/${id}/`, { is_dismissed: status === "resolved" });
}

// --- Rescue protocols (Rescue Plans) --------------------------------------------------

const RISK: Record<string, string> = { moderate: "medium", high: "high", critical: "critical" };

export async function fetchRescuePlans(): Promise<Row[]> {
  const [active, escalated, info] = await Promise.all([
    fetchAllPages<Row>("/intelligence/rescue-protocols/?status=active"),
    fetchAllPages<Row>("/intelligence/rescue-protocols/?status=escalated"),
    batches(),
  ]);
  const open = [...active, ...escalated];
  // The list omits internal notes (the vet's treatment plan); fetch them.
  const details = await Promise.all(
    open.map((p) => api.get<Row>(`/intelligence/rescue-protocols/${p.id}/`).catch(() => null)),
  );
  return open.map((p, i) => ({
    id: p.id,
    severity: RISK[p.risk_level] ?? p.risk_level,
    status: p.status === "escalated" ? "in_progress" : "open",
    diagnosis: p.trigger_reason,
    treatment: details[i]?.internal_notes || null,
    farmer_message: p.farmer_message,
    created_at: p.activated_at,
    farmers: farmOf(info.get(p.batch?.id)),
  }));
}

/** Save the vet's treatment plan on the protocol (internal notes). */
export const saveRescueTreatment = (id: string, treatment: string) =>
  api.patch(`/intelligence/rescue-protocols/${id}/`, { internal_notes: treatment });

export const resolveRescue = (id: string) =>
  api.patch(`/intelligence/rescue-protocols/${id}/`, { status: "resolved" });

// --- Farmer reviews (reports grouped by farm) -------------------------------------------

export async function fetchFarmerReviews(): Promise<Row[]> {
  const [reports, signals, info] = await Promise.all([
    fetchAllPages<Row>("/reports/"),
    fetchAllPages<Row>("/intelligence/signals/"),
    batches(),
  ]);
  const byFarm = new Map<string, Row>();
  const touch = (batchId: string | undefined, farmer: string | null, at: string) => {
    const b = info.get(batchId ?? "");
    const key = b?.farmId ?? batchId ?? "unknown";
    const row = byFarm.get(key) ?? {
      id: key,
      name: farmer ?? b?.farm ?? "Farmer",
      farm_name: b?.farm ?? null,
      livestock_type: b?.species ?? null,
      region: null,
      status: "active",
      avatar_url: null,
      updated_at: at,
      visit_reports: [] as Row[],
      health_cases: [] as Row[],
    };
    if (farmer) row.name = farmer;
    if (at > row.updated_at) row.updated_at = at;
    byFarm.set(key, row);
    return row;
  };
  for (const r of reports) {
    touch(r.batch?.id, r.submitted_by_name, r.created_at).visit_reports.push({
      id: r.id,
      status:
        REPORT_STATUS[r.status] === "approved"
          ? "approved"
          : r.status === "flagged"
            ? "rejected"
            : "pending",
    });
  }
  for (const s of signals.filter((x) => HEALTH_SIGNALS.has(x.signal_type))) {
    touch(s.batch?.id, null, s.created_at).health_cases.push({
      id: s.id,
      severity: SEVERITY[s.severity] ?? s.severity,
      status: s.is_dismissed ? "resolved" : "open",
    });
  }
  return [...byFarm.values()].sort((a, b) =>
    String(b.updated_at).localeCompare(String(a.updated_at)),
  );
}

// --- Aggregates (home, analytics, research insights) --------------------------------------

export async function fetchAgentKpis() {
  const [farms, plans, signals, reports, tasks] = await Promise.all([
    fetchAllPages<Row>("/farms/"),
    fetchAllPages<Row>("/ration/plans/?status=active"),
    fetchAllPages<Row>("/intelligence/signals/?is_dismissed=false"),
    fetchAllPages<Row>("/reports/?status=submitted"),
    // Staff tasks arrive with backend PR #20; until then there are none to count.
    fetchAllPages<Row>("/staff-tasks/?status=open&assignee=me").catch(() => []),
  ]);
  return {
    activeFarms: farms.filter((f) => f.is_active).length,
    plans: plans.length,
    cases: signals.filter((s) => HEALTH_SIGNALS.has(s.signal_type)).length,
    tasks: tasks.length,
    reports: reports.length,
  };
}

/** created_at timestamps of reports and health signals, for the analytics chart. */
export async function fetchActivityDates() {
  const [reports, signals] = await Promise.all([
    fetchAllPages<Row>("/reports/"),
    fetchAllPages<Row>("/intelligence/signals/"),
  ]);
  return {
    reports: reports.map((r) => ({ submitted_at: r.created_at })),
    cases: signals
      .filter((s) => HEALTH_SIGNALS.has(s.signal_type))
      .map((s) => ({ created_at: s.created_at })),
  };
}

export async function fetchInsightInputs() {
  const [signals, farms, plans] = await Promise.all([
    fetchHealthSignals(),
    fetchAllPages<Row>("/farms/"),
    fetchNutritionPlans(),
  ]);
  return {
    severities: signals.map((s) => ({ severity: s.severity })),
    livestock: farms.map((f) => ({
      livestock_type: f.primary_species?.name ?? f.primary_category?.name ?? null,
    })),
    planStatuses: plans.map((p) => ({ status: p.status })),
  };
}

// --- My support tickets -----------------------------------------------------------------

export async function fetchMyTickets(userId: string): Promise<Row[]> {
  const tickets = await fetchAllPages<Row>("/support/tickets/");
  return tickets
    .filter((t) => t.submitted_by?.id === userId)
    .map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      created_at: t.created_at,
    }));
}
