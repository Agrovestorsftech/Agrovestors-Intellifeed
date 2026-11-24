// Admin portal data from the IntelliFeed360 backend, mapped to the row shapes
// the Admin pages already render. Used by src/lib/ops/api.ts in api mode.
//
// Sources: /users/ (account administration), /farmers/ (farmer directory),
// /farms/assignments/ (agent per farm), /support/tickets/ (support desk).
//
// Roles: in api mode the role keys are the backend's own roles
// (admin, agent, nutritionist, veterinarian, feedops, ...), so an admin can
// pick nutritionist or vet precisely. Each user row's `role` is their main
// staff role; `roles` lists all of them.

import { api, fetchAllPages } from "@/lib/api/client";
import { fetchHealthSignals } from "@/lib/agent/data";

type Row = Record<string, any>;

// --- Roles ------------------------------------------------------------------

export const API_ROLES: Row[] = [
  { key: "admin", name: "Admin", description: "Full access to the dashboards and accounts." },
  {
    key: "agent",
    name: "Field Agent",
    description: "Visits assigned farms, logs visits and places orders.",
  },
  {
    key: "nutritionist",
    name: "Nutritionist (Admin Agent)",
    description: "Reviews reports and nutrition plans; works the support desk.",
  },
  {
    key: "veterinarian",
    name: "Veterinarian (Admin Agent)",
    description: "Handles health cases and approves health schedules; works the support desk.",
  },
  {
    key: "feedops",
    name: "Feed Operations",
    description: "Runs stock, production, quality control and deliveries.",
  },
  { key: "investor", name: "Investor", description: "Portfolio view (no dashboard yet)." },
  { key: "researcher", name: "Researcher", description: "Research mode in the farmer app." },
  { key: "farmer", name: "Farmer", description: "Uses the farmer app." },
].map((r) => ({ ...r, id: r.key, permissions: [], system: true }));

/** Order decides which role is shown as a user's main role. */
const ROLE_PRIORITY = [
  "super_admin",
  "admin",
  "feedops",
  "nutritionist",
  "veterinarian",
  "agent",
  "investor",
  "researcher",
  "farmer",
];

function mainRole(roles: string[]): string {
  const found = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0] ?? "farmer";
  return found === "super_admin" ? "admin" : found;
}

export const listRoles = async () => API_ROLES;

// --- Users ------------------------------------------------------------------

const userRow = (u: Row): Row => ({
  id: u.id,
  name:
    (u.full_name || `${u.first_name ?? ""} ${u.last_name ?? ""}`).trim() || u.email || "Unnamed",
  email: u.email ?? "",
  phone: u.phone ?? null,
  role: mainRole(u.roles ?? []),
  roles: u.roles ?? [],
  region: "—",
  status: u.invite_pending ? "invited" : u.status === "active" ? "active" : "suspended",
  last_active_at: u.last_login_at,
  created_at: u.created_at,
});

let usersCache: { at: number; data: Promise<Row[]> } | null = null;

export function listUsers(fresh = false): Promise<Row[]> {
  if (!fresh && usersCache && Date.now() - usersCache.at < 15_000) return usersCache.data;
  const data = fetchAllPages<Row>("/users/").then((rows) => rows.map(userRow));
  data.catch(() => (usersCache = null));
  usersCache = { at: Date.now(), data };
  return data;
}

async function findUser(id: string): Promise<Row> {
  const user = (await listUsers()).find((u) => u.id === id);
  if (!user) throw new Error("That account was not found. Reload the page and try again.");
  return user;
}

export async function inviteUser(v: Row) {
  const [first, ...rest] = String(v.name ?? "")
    .trim()
    .split(/\s+/);
  await api.post("/users/invite/", {
    email: v.email,
    first_name: first || v.email,
    last_name: rest.join(" ") || "-",
    roles: [v.role],
  });
}

async function setUserRole(user: Row, role: string) {
  if (user.roles.includes(role) && user.role === role) return;
  await api.post(`/users/${user.id}/roles/`, { role });
  if (user.role && user.role !== role && user.roles.includes(user.role)) {
    await api.delete(`/users/${user.id}/roles/${user.role}/`);
  }
}

async function setUserActive(id: string, active: boolean) {
  await api.post(`/users/${id}/${active ? "reactivate" : "deactivate"}/`);
}

// --- Farmers ----------------------------------------------------------------

export async function listFarmers(): Promise<Row[]> {
  const farmers = await fetchAllPages<Row>("/farmers/");
  return farmers.map((f) => {
    const farms: Row[] = f.farms ?? [];
    const first = farms[0];
    return {
      id: f.id,
      name:
        (f.full_name || `${f.first_name ?? ""} ${f.last_name ?? ""}`).trim() || f.email || "Farmer",
      farm_name: first?.name ?? null,
      farms: farms.map((farm) => ({
        id: farm.id,
        name: farm.name,
        agent_id: farm.agent?.id ?? null,
      })),
      region: first?.state?.name ?? null,
      phone: f.phone,
      email: f.email,
      livestock_type: first?.primary_species?.name ?? null,
      status: f.status === "active" ? "active" : "inactive",
      assigned_agent_id: first?.agent?.id ?? null,
      created_at: f.created_at,
      // Not in the directory yet; kept so the pages' counts render.
      visit_reports: [],
      health_cases: [],
    };
  });
}

/** Assign `agentId` to every farm of the farmer, ending earlier assignments. */
async function assignFarmerAgent(farmerId: string, agentId: string) {
  const farmer = (await listFarmers()).find((f) => f.id === farmerId);
  const farms: Row[] = farmer?.farms ?? [];
  if (!farms.length) throw new Error("This farmer has no farm yet, so there's nothing to assign.");
  // The assignments endpoint has no farm filter, so match farms here: only
  // this farmer's farms are ever changed.
  const active = await fetchAllPages<Row>("/farms/assignments/");
  for (const farm of farms) {
    if (farm.agent_id === agentId) continue;
    const current = active.filter((a) => a.farm?.id === farm.id);
    await api.post("/farms/assignments/", { farm_id: farm.id, agent_id: agentId, is_active: true });
    for (const a of current) {
      if (a.is_active && a.agent?.id !== agentId) {
        await api.patch(`/farms/assignments/${a.id}/`, {
          is_active: false,
          ended_at: new Date().toISOString(),
        });
      }
    }
  }
}

// --- Visits (Agents page) -----------------------------------------------------

/** Every agent's visits (admins see all), in the demo visit-report shape. */
export async function listVisits(): Promise<Row[]> {
  const visits = await fetchAllPages<Row>("/farms/visits/");
  return visits.map((v) => ({
    id: v.id,
    agent_id: v.agent?.id ?? null,
    farmer_id: null,
    species: null,
    status: "completed",
    summary: v.summary,
    submitted_at: new Date(`${v.visit_date}T12:00:00`).toISOString(),
    farmers: { name: v.farm?.name ?? null, region: null },
  }));
}

// --- Support tickets ----------------------------------------------------------

const PORTAL_OF: Record<string, string> = {
  admin: "admin",
  agent: "field",
  nutritionist: "agent",
  veterinarian: "agent",
  feedops: "feedops",
};

export async function listTickets(): Promise<Row[]> {
  const [tickets, users] = await Promise.all([
    fetchAllPages<Row>("/support/tickets/"),
    listUsers(),
  ]);
  const byId = new Map(users.map((u) => [u.id, u]));
  return tickets.map((t) => {
    const submitter = byId.get(t.submitted_by?.id);
    return {
      id: t.id,
      subject: t.subject,
      description: t.description,
      priority: t.priority,
      status: t.status,
      opened_by: t.submitted_by?.id ?? null,
      portal: PORTAL_OF[submitter?.role ?? ""] ?? "field",
      assigned_to: t.assigned_to?.full_name ?? null,
      notes: null,
      created_at: t.created_at,
      updated_at: t.updated_at,
    };
  });
}

async function updateTicket(id: string, patch: Row) {
  const body: Row = {};
  if (patch.status) body.status = patch.status;
  if (patch.priority) body.priority = patch.priority;
  if (typeof patch.assigned_to === "string") {
    // Pages pass a name; resolve it to a desk member (unknown names stay as is).
    const match = (await listUsers()).find((u) => u.name === patch.assigned_to);
    if (match) body.assigned_to_id = match.id;
  }
  if (Object.keys(body).length) await api.patch(`/support/tickets/${id}/`, body);
}

// --- Generic writes from the Admin pages --------------------------------------

/** The Admin pages write through updateRow/insertRow/deleteRow; in api mode
 * these become the matching backend actions. Unsupported tables throw. */
export async function updateRow(table: string, id: string, patch: Row) {
  if (table === "users") {
    const user = await findUser(id);
    if (patch.role && patch.role !== user.role) await setUserRole(user, patch.role);
    if (patch.status) await setUserActive(id, patch.status === "active");
  } else if (table === "farmers") {
    if (patch.assigned_agent_id) await assignFarmerAgent(id, patch.assigned_agent_id);
    if (patch.status) await setUserActive(id, patch.status === "active");
  } else if (table === "support_tickets") {
    await updateTicket(id, patch);
  } else {
    throw new Error("This change isn't available on the live system yet.");
  }
  usersCache = null;
}

export async function insertRow(table: string, row: Row) {
  if (table === "users") return inviteUser(row);
  throw new Error("This isn't available on the live system yet.");
}

export async function deleteRow(table: string, id: string) {
  // Accounts are never deleted on the backend; deactivate instead.
  if (table === "users") return setUserActive(id, false);
  throw new Error("This isn't available on the live system yet.");
}

// --- Admin home KPIs ------------------------------------------------------------

/** Same shape as the demo fetchAdminKpis. Figures the backend doesn't have
 * yet (nutrition plans, visit reports) are null. */
export async function fetchAdminKpis() {
  const [users, farmers, open, inProgress, orders, stock, health] = await Promise.all([
    listUsers(),
    listFarmers(),
    fetchAllPages<Row>("/support/tickets/?status=open"),
    fetchAllPages<Row>("/support/tickets/?status=in_progress"),
    fetchAllPages<Row>("/products/orders/"),
    fetchAllPages<Row>("/feedops/stock/").catch(() => []),
    // Same source as the vets' Health Assessments page: health signals not dismissed.
    fetchHealthSignals().catch(() => null),
  ]);
  return {
    totalFarmers: farmers.length,
    activeFarmers: farmers.filter((f) => f.status === "active").length,
    totalUsers: users.length,
    activePlans: null,
    openCases: health ? health.filter((h) => h.status === "open").length : null,
    pendingReports: null,
    pendingOrders: orders.filter((o) => ["placed", "confirmed", "dispatched"].includes(o.status))
      .length,
    inventoryItems: stock.length,
    supportTickets: open.length + inProgress.length,
  };
}

// --- Audit trail ----------------------------------------------------------------

/** "report.reviewed" -> "reviewed"; the page tones created/updated/deleted. */
function auditVerb(action: string): string {
  const verb = action.split(".").pop() ?? action;
  if (/creat|add|invit|register|placed/.test(verb)) return "created";
  if (/delet|remov|revok|deactivat|cancel/.test(verb)) return "deleted";
  return verb.replace(/_/g, " ");
}

const RECORD_LABEL_KEYS = ["name", "full_name", "title", "subject", "batch_code", "order_code", "email"];

/** GET /notifications/audit-logs/ (admins), in the Audit Trail page's row shape. */
export async function listAuditLogs(limit?: number): Promise<Row[]> {
  const rows = limit
    ? (await api.get<{ results: Row[] }>(`/notifications/audit-logs/?page_size=${limit}`)).results
    : await fetchAllPages<Row>("/notifications/audit-logs/");
  return rows.map((r) => {
    const next: Row = r.new_values ?? {};
    const prev: Row = r.old_values ?? {};
    const labelKey = RECORD_LABEL_KEYS.find((k) => next[k] ?? prev[k]);
    // The first value that changed (or was set), for the Change column.
    const field = Object.keys(next).find((k) => k !== labelKey && String(next[k]) !== String(prev[k] ?? ""));
    return {
      id: r.id,
      created_at: r.created_at,
      actor_name: r.actor_name ?? "System",
      ip: r.ip_address ?? null,
      action: auditVerb(String(r.action ?? "")),
      raw_action: r.action,
      entity: String(r.entity_type ?? "record")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toLowerCase(),
      target: labelKey ? String(next[labelKey] ?? prev[labelKey]) : `#${String(r.entity_id).slice(0, 8)}`,
      field: field ?? null,
      from: field && prev[field] != null ? String(prev[field]) : null,
      to: field && next[field] != null ? String(next[field]) : null,
    };
  });
}
