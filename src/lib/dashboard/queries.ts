import { mockDb as db } from "@/lib/mock/db";
import * as knowledgeApi from "@/lib/api/knowledge";
import * as supportApi from "@/lib/api/support";
import * as farmersApi from "@/lib/api/farmers";

export type CountResult = number;

type Query = ReturnType<typeof db.from>;

async function count(table: string, filter?: (q: Query) => Query): Promise<CountResult> {
  let q = db.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c, error } = await q;
  if (error) throw error;
  return c ?? 0;
}

/* --------------------------------- Admin --------------------------------- */

export async function fetchAdminKpis() {
  const [
    totalFarmers,
    activeFarmers,
    totalRoles,
    activePlans,
    openCases,
    pendingReports,
    pendingOrders,
    inventoryItems,
    supportTickets,
  ] = await Promise.all([
    farmersApi.countFarmers(),
    farmersApi.countFarmers({ status: "active" }),
    count("user_roles"),
    count("nutrition_plans"),
    count("health_cases", (q) => q.in("status", ["open", "in_progress"])),
    count("visit_reports", (q) => q.in("status", ["pending", "under_review"])),
    count("feed_orders", (q) => q.in("status", ["placed", "pending", "processing", "out_for_delivery"])),
    count("inventory_items"),
    supportApi.countOpenSupportTickets(),
  ]);
  return {
    totalFarmers,
    activeFarmers,
    totalUsers: totalRoles,
    activePlans,
    openCases,
    pendingReports,
    pendingOrders,
    inventoryItems,
    supportTickets,
  };
}

export async function fetchUserDistribution() {
  const { data, error } = await db.from("user_roles").select("role");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of data ?? []) {
    counts[r.role] = (counts[r.role] ?? 0) + 1;
  }
  return counts;
}

/* Platform performance: users added + orders placed per day, last 7 days */
export async function fetchPlatformSeries() {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const [{ data: farmers, error: e1 }, { data: orders, error: e2 }] = await Promise.all([
    db.from("farmers").select("created_at").gte("created_at", since.toISOString()),
    db.from("feed_orders").select("placed_at").gte("placed_at", since.toISOString()),
  ]);
  if (e1 ?? e2) throw e1 ?? e2;
  const days: { day: string; users: number; orders: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      users: (farmers ?? []).filter((r) => r.created_at?.slice(0, 10) === key).length,
      orders: (orders ?? []).filter((r) => r.placed_at?.slice(0, 10) === key).length,
    });
  }
  return days;
}

/* --------------------------------- Agent (Admin Agent) --------------------------------- */

export async function fetchAgentKpis() {
  const [activeFarms, plans, cases, tasks, reports] = await Promise.all([
    count("farmers", (q) => q.eq("status", "active")),
    count("nutrition_plans", (q) => q.eq("status", "active")),
    count("health_cases", (q) => q.in("status", ["open", "in_progress", "monitoring"])),
    count("tasks", (q) => q.eq("status", "open")),
    count("visit_reports", (q) => q.in("status", ["pending", "under_review"])),
  ]);
  return { activeFarms, plans, cases, tasks, reports };
}

export type ReportRow = {
  id: string;
  farmer: string;
  farm: string;
  species: string | null;
  submitted: string;
  priority: string;
  status: string;
};

export async function fetchPendingReports(limit = 8): Promise<ReportRow[]> {
  const { data, error } = await db
    .from("visit_reports")
    .select("id, species, priority, status, submitted_at, farmers(name, farm_name)")
    .in("status", ["pending", "under_review"])
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    farmer: r.farmers?.name ?? "Farmer",
    farm: r.farmers?.farm_name ?? "—",
    species: r.species,
    submitted: relativeTime(r.submitted_at),
    priority: formatPriority(r.priority ?? "normal"),
    status: formatReportStatus(r.status),
  }));
}

export async function fetchFarmerHealth(limit = 8) {
  const { data, error } = await db
    .from("farmers")
    .select("id, farm_name, livestock_type, updated_at, health_cases(severity, status)")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((f: any) => {
    const openCases = (f.health_cases ?? []).filter((c: any) => c.status !== "resolved");
    const worst: string = openCases.reduce((acc: string, c: any) => (severityRank(c.severity) > severityRank(acc) ? c.severity : acc), "low");
    const score = openCases.length === 0 ? 92 : openCases.length === 1 ? 82 : openCases.length === 2 ? 68 : 55;
    return {
      id: f.id,
      farm: f.farm_name ?? "—",
      species: f.livestock_type ?? "—",
      score,
      risk: openCases.length === 0 ? "Low" : worst === "critical" || worst === "high" ? "High" : "Medium",
      lastReview: relativeTime(f.updated_at),
    };
  });
}

export async function fetchCriticalAlerts(limit = 6) {
  const { data, error } = await db
    .from("health_cases")
    .select("id, severity, status, diagnosis, created_at, farmers(farm_name)")
    .neq("status", "resolved")
    .in("severity", ["high", "critical"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id,
    title: c.diagnosis ?? "Health alert",
    farm: c.farmers?.farm_name ?? "—",
    priority: c.severity === "critical" ? "Critical" : "High",
  }));
}

export async function fetchKnowledgeArticles(limit = 6) {
  return knowledgeApi.listArticles({ limit });
}

/* --------------------------------- FeedOps --------------------------------- */

export async function fetchFeedOpsKpis() {
  const [inventoryRows, ordersToday, pendingOrders, lowStock, production] = await Promise.all([
    db.from("inventory_items").select("quantity, reorder_level"),
    count("feed_orders", (q) => q.gte("placed_at", startOfDay())),
    count("feed_orders", (q) => q.in("status", ["placed", "pending", "processing"])),
    db.from("inventory_items").select("id, quantity, reorder_level"),
    count("production_runs", (q) => q.in("status", ["queued", "running"])),
  ]);
  if (inventoryRows.error ?? lowStock.error) throw inventoryRows.error ?? lowStock.error;
  const totalInv = (inventoryRows.data ?? []).reduce((s, r: any) => s + Number(r.quantity ?? 0), 0);
  const lowCount = (lowStock.data ?? []).filter((r: any) => Number(r.quantity) <= Number(r.reorder_level)).length;
  return {
    totalInventory: totalInv,
    deliveriesToday: ordersToday,
    pendingOrders,
    lowStock: lowCount,
    productionQueue: production,
  };
}

export async function fetchInventoryRows(limit = 8) {
  const { data, error } = await db
    .from("inventory_items")
    .select("id, quantity, reorder_level, warehouse, feed_products(name, unit)")
    .order("quantity", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    feed: r.feed_products?.name ?? "—",
    stock: Number(r.quantity ?? 0),
    unit: r.feed_products?.unit ?? "kg",
    status:
      Number(r.quantity) === 0
        ? "Critical"
        : Number(r.quantity) <= Number(r.reorder_level)
          ? "Low Stock"
          : "Good",
  }));
}

export async function fetchProductionSeries() {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const { data, error } = await db
    .from("production_runs")
    .select("quantity, started_at")
    .gte("started_at", since.toISOString());
  if (error) throw error;
  const days: { day: string; mt: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const qty = (data ?? [])
      .filter((r) => r.started_at?.slice(0, 10) === key)
      .reduce((s, r: any) => s + Number(r.quantity ?? 0), 0);
    days.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      mt: Math.round((qty / 1000) * 10) / 10,
    });
  }
  return days;
}

export async function fetchRecentOrders(limit = 6) {
  const { data, error } = await db
    .from("feed_orders")
    .select("id, order_no, status, placed_at, farmers(farm_name)")
    .order("placed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((o: any) => ({
    id: o.id,
    orderNo: o.order_no,
    farm: o.farmers?.farm_name ?? "—",
    status: formatOrderStatus(o.status),
  }));
}

/* --------------------------------- Field Agent --------------------------------- */

export async function fetchFieldKpis(userId: string | undefined) {
  if (!userId) return { assigned: 0, todayVisits: 0, pendingReports: 0, completedThisWeek: 0, urgentAlerts: 0 };
  const startWeek = new Date();
  startWeek.setDate(startWeek.getDate() - 7);
  const [assigned, todayVisits, pendingReports, completedThisWeek, urgentAlerts] = await Promise.all([
    count("farmers", (q) => q.eq("assigned_agent_id", userId)),
    count("visit_reports", (q) => q.eq("agent_id", userId).gte("submitted_at", startOfDay())),
    count("visit_reports", (q) => q.eq("agent_id", userId).in("status", ["pending", "under_review"])),
    count("visit_reports", (q) => q.eq("agent_id", userId).gte("submitted_at", startWeek.toISOString())),
    count("health_cases", (q) => q.in("severity", ["critical", "high"]).neq("status", "resolved")),
  ]);
  return { assigned, todayVisits, pendingReports, completedThisWeek, urgentAlerts };
}

export async function fetchTodaysSchedule(userId: string | undefined, limit = 6) {
  if (!userId) return [];
  const { data, error } = await db
    .from("visit_reports")
    .select("id, species, status, submitted_at, farmers(farm_name)")
    .eq("agent_id", userId)
    .gte("submitted_at", startOfDay())
    .order("submitted_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  const now = Date.now();
  return (data ?? []).map((r) => ({
    id: r.id,
    farm: r.farmers?.farm_name ?? "—",
    category: r.species ? `${r.species[0].toUpperCase()}${r.species.slice(1)} visit` : "Visit",
    time: new Date(r.submitted_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    status: new Date(r.submitted_at).getTime() > now ? "Upcoming" : r.status === "pending" ? "Pending" : "Completed",
  }));
}

/* --------------------------------- Shared --------------------------------- */

export async function fetchActivities(limit = 20) {
  const [visits, cases, plans] = await Promise.all([
    db.from("visit_reports").select("id, species, summary, submitted_at, farmers(farm_name)").order("submitted_at", { ascending: false }).limit(limit),
    db.from("health_cases").select("id, diagnosis, created_at, farmers(farm_name)").order("created_at", { ascending: false }).limit(limit),
    db.from("nutrition_plans").select("id, plan_name, created_at, farmers(farm_name)").order("created_at", { ascending: false }).limit(limit),
  ]);
  const err = visits.error ?? cases.error ?? plans.error;
  if (err) throw err;
  return [
    ...(visits.data ?? []).map((v) => ({
      id: v.id,
      activity_type: "visit_report_submitted",
      description: `Visit report — ${v.farmers?.farm_name ?? "farm"}`,
      metadata: v,
      created_at: v.submitted_at as string,
    })),
    ...(cases.data ?? []).map((c) => ({
      id: c.id,
      activity_type: "health_case_created",
      description: `${c.diagnosis ?? "Health case"} — ${c.farmers?.farm_name ?? "farm"}`,
      metadata: c,
      created_at: c.created_at as string,
    })),
    ...(plans.data ?? []).map((p) => ({
      id: p.id,
      activity_type: "nutrition_plan_created",
      description: p.plan_name ?? "Nutrition plan",
      metadata: p,
      created_at: p.created_at as string,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function fetchUnreadNotifications() {
  const { data, error } = await db
    .from("notifications")
    .select("id, title, body, type, read_at, created_at")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllNotifications(limit = 20) {
  const { data, error } = await db
    .from("notifications")
    .select("id, title, body, type, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchSupportTickets(limit = 6) {
  const tickets = await supportApi.listSupportTickets({ page_size: limit });
  return tickets.filter((ticket) => !["resolved", "closed"].includes(ticket.status));
}

export async function fetchSystemLogs(limit = 8) {
  const { data, error } = await db
    .from("system_logs")
    .select("id, action, entity, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/* --------------------------------- helpers --------------------------------- */

function severityRank(sev: string): number {
  const m: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  return m[sev] ?? 0;
}

function startOfDay(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatOrderStatus(s: string): "Pending" | "Processing" | "Out for Delivery" | "Delivered" {
  const key = s.toLowerCase();
  if (key === "pending" || key === "placed") return "Pending";
  if (key === "processing") return "Processing";
  if (key === "out_for_delivery" || key === "out for delivery") return "Out for Delivery";
  return "Delivered";
}

export function formatPriority(p: string): "High" | "Medium" | "Normal" {
  const k = p.toLowerCase();
  if (k === "high" || k === "critical") return "High";
  if (k === "medium") return "Medium";
  return "Normal";
}

export function formatReportStatus(s: string): "Pending" | "Under Review" {
  return s === "under_review" ? "Under Review" : "Pending";
}

/* ================================ PHASE 2: ADMIN AGENT PAGES ================================ */

/* ---- NUTRITION PLANS ---- */

export type NutritionPlanRow = {
  id: string;
  farm: string;
  plan_name: string;
  status: string;
  created_at: string;
  assigned_to: string;
};

export async function fetchNutritionPlans(limit = 50): Promise<NutritionPlanRow[]> {
  const { data, error } = await db
    .from("nutrition_plans")
    .select("id, plan_name, status, created_at, assigned_to, farmers(farm_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    id: p.id,
    farm: p.farmers?.farm_name ?? "—",
    plan_name: p.plan_name ?? "Untitled",
    status: p.status ?? "draft",
    created_at: relativeTime(p.created_at),
    assigned_to: p.assigned_to ?? "—",
  }));
}

export async function fetchNutritionPlanDetail(id: string) {
  const { data, error } = await db
    .from("nutrition_plans")
    .select("id, plan_name, status, description, created_at, updated_at, assigned_to, farmer_id, farmers(farm_name, name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/* ---- HEALTH ASSESSMENTS (Health Cases) ---- */

export type HealthCaseRow = {
  id: string;
  farm: string;
  diagnosis: string;
  severity: string;
  status: string;
  date: string;
  assigned_to: string;
};

export async function fetchHealthCases(limit = 50): Promise<HealthCaseRow[]> {
  const { data, error } = await db
    .from("health_cases")
    .select("id, diagnosis, severity, status, created_at, assigned_to, farmers(farm_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id,
    farm: c.farmers?.farm_name ?? "—",
    diagnosis: c.diagnosis ?? "Unknown",
    severity: c.severity ?? "low",
    status: c.status ?? "open",
    date: relativeTime(c.created_at),
    assigned_to: c.assigned_to ?? "—",
  }));
}

export async function fetchHealthCaseDetail(id: string) {
  const { data, error } = await db
    .from("health_cases")
    .select("id, diagnosis, severity, status, description, created_at, updated_at, assigned_to, farmer_id, farmers(farm_name, name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/* ---- RESCUE PLANS (Health Cases filtered for severity) ---- */

export type RescuePlanRow = {
  id: string;
  farm: string;
  risk_level: string;
  intervention: string;
  status: string;
  created_at: string;
};

export async function fetchRescuePlans(limit = 50): Promise<RescuePlanRow[]> {
  const { data, error } = await db
    .from("health_cases")
    .select("id, diagnosis, severity, status, created_at, farmers(farm_name)")
    .in("severity", ["high", "critical"])
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id,
    farm: c.farmers?.farm_name ?? "—",
    risk_level: c.severity ?? "high",
    intervention: c.diagnosis ?? "Emergency response",
    status: c.status ?? "open",
    created_at: relativeTime(c.created_at),
  }));
}

/* ---- VISIT REPORTS FOR REVIEW ---- */

export type ReviewReportRow = {
  id: string;
  farm: string;
  report_type: string;
  submitted_by: string;
  status: string;
  date: string;
  priority: string;
};

export async function fetchVisitReportsForReview(limit = 50): Promise<ReviewReportRow[]> {
  const { data, error } = await db
    .from("visit_reports")
    .select("id, species, status, submitted_at, priority, agent_id, farmers(farm_name, name)")
    .in("status", ["pending", "under_review"])
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    farm: r.farmers?.farm_name ?? "—",
    report_type: r.species ?? "General",
    submitted_by: r.farmers?.name ?? "—",
    status: r.status ?? "pending",
    date: relativeTime(r.submitted_at),
    priority: r.priority ?? "normal",
  }));
}

export async function fetchReportDetail(id: string) {
  const { data, error } = await db
    .from("visit_reports")
    .select("id, species, notes, status, submitted_at, priority, agent_id, farmer_id, farmers(farm_name, name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/* ---- FARMER REVIEWS ---- */

export type FarmerReviewRow = {
  id: string;
  farm: string;
  farmer_name: string;
  species: string;
  last_review: string;
  report_count: number;
  health_score: number;
};

export async function fetchFarmersWithReportSummary(limit = 50): Promise<FarmerReviewRow[]> {
  const farmers = await farmersApi.listFarmers({ page_size: limit });
  return farmers.map((f) => ({
    id: f.id,
    farm: f.farm_name ?? "—",
    farmer_name: f.name ?? "—",
    species: f.livestock_type ?? "—",
    last_review: relativeTime(f.updated_at),
    report_count: f.report_count,
    health_score: Math.max(50, 95 - f.open_health_cases * 10),
  }));
}

export async function fetchFarmerReviewDetail(farmerId: string) {
  const [farmer, visits, healthCases, nutritionPlans] = await Promise.all([
    farmersApi.getFarmer(farmerId),
    db.from("visit_reports").select("id, species, status").eq("farmer_id", farmerId),
    db.from("health_cases").select("id, diagnosis, status").eq("farmer_id", farmerId),
    db.from("nutrition_plans").select("id, plan_name, status").eq("farmer_id", farmerId),
  ]);
  if (visits.error ?? healthCases.error ?? nutritionPlans.error) throw visits.error ?? healthCases.error ?? nutritionPlans.error;
  return {
    ...farmer,
    visit_reports: visits.data ?? [],
    health_cases: healthCases.data ?? [],
    nutrition_plans: nutritionPlans.data ?? [],
  };
}

/* ---- SUPPORT TICKETS (Extended) ---- */

export type SupportTicketRow = {
  id: string;
  ticket_id: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  assigned_to: string;
};

export async function fetchSupportTicketsForPage(limit = 50): Promise<SupportTicketRow[]> {
  const tickets = await supportApi.listSupportTickets({ page_size: limit });
  return tickets.map((t) => ({
    id: t.id,
    ticket_id: t.id.slice(0, 8).toUpperCase(),
    subject: t.subject ?? "No subject",
    priority: t.priority ?? "normal",
    status: t.status ?? "open",
    created_at: relativeTime(t.created_at),
    assigned_to: t.assigned_to ?? "—",
  }));
}

export async function fetchSupportTicketDetail(id: string) {
  return supportApi.getSupportTicket(id);
}

/* ---- KNOWLEDGE ARTICLES ---- */

export type ArticleRow = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  updated_at: string;
  is_published: boolean;
};

export async function fetchArticles(limit = 100, category?: string, search?: string): Promise<ArticleRow[]> {
  return knowledgeApi.listArticles({ limit, category, search });
}

export async function fetchArticleDetail(id: string) {
  return knowledgeApi.getArticle(id);
}

/* ---- RESEARCH INSIGHTS (Aggregates) ---- */

export type InsightData = {
  most_common_diagnosis: string;
  top_nutrition_issue: string;
  case_resolution_rate: number;
  disease_prevalence: Array<{ diagnosis: string; count: number }>;
  severity_distribution: Array<{ severity: string; count: number }>;
  recovery_trends: Array<{ month: string; resolved: number; total: number }>;
};

export async function fetchResearchInsights(): Promise<InsightData> {
  const [healthCases, nutritionPlans] = await Promise.all([
    db.from("health_cases").select("diagnosis, severity, status, created_at"),
    db.from("nutrition_plans").select("status, created_at, plan"),
  ]);

  if (healthCases.error ?? nutritionPlans.error) throw healthCases.error ?? nutritionPlans.error;
  const cases = healthCases.data ?? [];
  const plans = nutritionPlans.data ?? [];

  // Most common diagnosis
  const diagnosisCounts: Record<string, number> = {};
  cases.forEach((c: any) => {
    if (c.diagnosis) diagnosisCounts[c.diagnosis] = (diagnosisCounts[c.diagnosis] ?? 0) + 1;
  });
  const most_common_diagnosis = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Most common nutrition issue, from each plan's focus
  const focusCounts: Record<string, number> = {};
  plans.forEach((p) => {
    const focus = p.plan?.focus;
    if (focus) focusCounts[focus] = (focusCounts[focus] ?? 0) + 1;
  });
  const top_nutrition_issue = Object.entries(focusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Case resolution rate
  const resolved = cases.filter((c: any) => c.status === "resolved").length;
  const case_resolution_rate = cases.length > 0 ? Math.round((resolved / cases.length) * 100) : 0;

  // Disease prevalence (top 5)
  const disease_prevalence = Object.entries(diagnosisCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([diagnosis, count]) => ({ diagnosis, count }));

  // Severity distribution
  const severityCounts: Record<string, number> = {};
  cases.forEach((c: any) => {
    const sev = c.severity ?? "low";
    severityCounts[sev] = (severityCounts[sev] ?? 0) + 1;
  });
  const severity_distribution = Object.entries(severityCounts)
    .map(([severity, count]) => ({ severity, count }))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  // Recovery trends (last 6 months)
  const recovery_trends: Array<{ month: string; resolved: number; total: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().slice(0, 7);
    const monthCases = cases.filter((c: any) => c.created_at?.slice(0, 7) === monthKey);
    const monthResolved = monthCases.filter((c: any) => c.status === "resolved").length;
    recovery_trends.push({
      month: d.toLocaleDateString(undefined, { month: "short" }),
      resolved: monthResolved,
      total: monthCases.length,
    });
  }

  return {
    most_common_diagnosis,
    top_nutrition_issue,
    case_resolution_rate,
    disease_prevalence,
    severity_distribution,
    recovery_trends,
  };
}

/* ================================ PHASE 3: SHARED PAGES ================================ */

/* ---- ANALYTICS ---- */

export type AnalyticsData = {
  total_farms: number;
  active_cases: number;
  avg_health_score: number;
  reports_this_week: number;
  case_severity_distribution: Array<{ severity: string; count: number }>;
  farm_health_trends: Array<{ farm: string; score: number }>;
  report_submission_pattern: Array<{ day: string; count: number }>;
};

export async function fetchAnalyticsSeries(): Promise<AnalyticsData> {
  const week = new Date();
  week.setDate(week.getDate() - 7);
  const [farmers, cases, reports] = await Promise.all([
    db.from("farmers").select("id, farm_name, health_cases(status)"),
    db.from("health_cases").select("severity, status"),
    db.from("visit_reports").select("submitted_at").gte("submitted_at", week.toISOString()),
  ]);

  if (farmers.error ?? cases.error ?? reports.error) throw farmers.error ?? cases.error ?? reports.error;
  const farmerCount = (farmers.data ?? []).length;
  const activeCases = (cases.data ?? []).filter((c: any) => c.status !== "resolved").length;
  const totalScore = (farmers.data ?? []).reduce((sum: number, f: any) => {
    const openCases = (f.health_cases ?? []).filter((c: any) => c.status !== "resolved").length;
    const score = Math.max(50, 95 - openCases * 10);
    return sum + score;
  }, 0);
  const avgHealthScore = farmerCount > 0 ? Math.round(totalScore / farmerCount) : 0;

  const severityCounts: Record<string, number> = {};
  (cases.data ?? []).forEach((c: any) => {
    const sev = c.severity ?? "low";
    severityCounts[sev] = (severityCounts[sev] ?? 0) + 1;
  });

  const case_severity_distribution = Object.entries(severityCounts)
    .map(([severity, count]) => ({ severity, count }))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  const farm_health_trends = (farmers.data ?? [])
    .slice(0, 10)
    .map((f: any) => {
      const openCases = (f.health_cases ?? []).filter((c: any) => c.status !== "resolved").length;
      const score = Math.max(50, 95 - openCases * 10);
      return { farm: f.farm_name ?? "—", score };
    });

  const reportsByDay: Record<string, number> = {};
  (reports.data ?? []).forEach((r: any) => {
    const day = new Date(r.submitted_at).toISOString().slice(0, 10);
    reportsByDay[day] = (reportsByDay[day] ?? 0) + 1;
  });

  const report_submission_pattern: Array<{ day: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().slice(0, 10);
    report_submission_pattern.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      count: reportsByDay[dayKey] ?? 0,
    });
  }

  return {
    total_farms: farmerCount,
    active_cases: activeCases,
    avg_health_score: avgHealthScore,
    reports_this_week: (reports.data ?? []).length,
    case_severity_distribution,
    farm_health_trends,
    report_submission_pattern,
  };
}