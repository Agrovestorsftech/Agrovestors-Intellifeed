import { supabase } from "@/integrations/supabase/client";

export type CountResult = number;

async function count(table: string, filter?: (q: ReturnType<typeof supabase.from>) => any): Promise<CountResult> {
  let q: any = supabase.from(table as any).select("*", { count: "exact", head: true });
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
    count("farmers"),
    count("farmers", (q) => q.eq("status", "active")),
    count("user_roles"),
    count("nutrition_plans", (q) => q.eq("status", "active")),
    count("health_cases", (q) => q.in("status", ["open", "in_progress"])),
    count("visit_reports", (q) => q.in("status", ["pending", "under_review"])),
    count("feed_orders", (q) => q.in("status", ["pending", "processing", "out_for_delivery"])),
    count("inventory_items"),
    count("support_tickets", (q) => q.in("status", ["open", "in_progress"])),
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
  const { data, error } = await supabase.from("user_roles").select("role");
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
  const [{ data: farmers }, { data: orders }] = await Promise.all([
    supabase.from("farmers").select("created_at").gte("created_at", since.toISOString()),
    supabase.from("feed_orders").select("placed_at").gte("placed_at", since.toISOString()),
  ]);
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
    count("health_cases", (q) => q.in("status", ["open", "in_progress"])),
    count("tasks", (q) => q.in("status", ["pending", "in_progress"])),
    count("visit_reports", (q) => q.eq("status", "pending")),
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
  const { data, error } = await supabase
    .from("visit_reports")
    .select("id, priority, status, species, submitted_at, farmers(name, farm_name)")
    .in("status", ["pending", "under_review"])
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    farmer: r.farmers?.name ?? "Unknown",
    farm: r.farmers?.farm_name ?? "—",
    species: r.species,
    submitted: relativeTime(r.submitted_at),
    priority: r.priority,
    status: r.status,
  }));
}

export async function fetchFarmerHealth(limit = 8) {
  const { data, error } = await supabase
    .from("farmers")
    .select("id, farm_name, livestock_type, status, updated_at, health_cases(severity, status)")
    .eq("status", "active")
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
  const { data, error } = await supabase
    .from("health_cases")
    .select("id, severity, status, diagnosis, created_at, farmers(farm_name)")
    .in("severity", ["critical", "high"])
    .neq("status", "resolved")
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
  const { data, error } = await supabase
    .from("knowledge_articles")
    .select("id, title, category, tags")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/* --------------------------------- FeedOps --------------------------------- */

export async function fetchFeedOpsKpis() {
  const [inventoryRows, ordersToday, pendingOrders, lowStock, production] = await Promise.all([
    supabase.from("inventory_items").select("quantity, reorder_level"),
    count("feed_orders", (q) => q.gte("placed_at", startOfDay())),
    count("feed_orders", (q) => q.in("status", ["pending", "processing"])),
    supabase.from("inventory_items").select("id, quantity, reorder_level"),
    count("production_runs", (q) => q.in("status", ["queued", "running"])),
  ]);
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const [assigned, todayReports, pending, weekReports, alerts] = await Promise.all([
    count("farmers", (q) => q.eq("assigned_agent_id", userId)),
    count("visit_reports", (q) => q.eq("agent_id", userId).gte("submitted_at", startOfDay())),
    count("visit_reports", (q) => q.eq("agent_id", userId).eq("status", "pending")),
    count("visit_reports", (q) => q.eq("agent_id", userId).gte("submitted_at", startWeek.toISOString())),
    count("health_cases", (q) => q.in("severity", ["critical", "high"]).neq("status", "resolved")),
  ]);
  return { assigned, todayVisits: todayReports, pendingReports: pending, completedThisWeek: weekReports, urgentAlerts: alerts };
}

export async function fetchTodaysSchedule(userId: string | undefined, limit = 6) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("visit_reports")
    .select("id, status, species, submitted_at, farmers(farm_name)")
    .eq("agent_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    farm: r.farmers?.farm_name ?? "—",
    category: r.species ?? "—",
    time: new Date(r.submitted_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    status: r.status === "approved" || r.status === "reviewed" ? "Completed" : r.status === "under_review" ? "Upcoming" : "Pending",
  }));
}

/* --------------------------------- Shared --------------------------------- */

export async function fetchActivities(limit = 20) {
  const { data, error } = await supabase
    .from("activities")
    .select("id, verb, meta, created_at, target_type, target_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchUnreadNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, link, type, created_at, read_at")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllNotifications(limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, link, type, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function fetchSupportTickets(limit = 6) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, priority, status, created_at")
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchSystemLogs(limit = 8) {
  const { data, error } = await supabase
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
  if (key === "pending") return "Pending";
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data: farmers, error } = await supabase
    .from("farmers")
    .select("id, farm_name, name, livestock_type, updated_at, visit_reports(id), health_cases(id, status)")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (farmers ?? []).map((f: any) => {
    const reportCount = (f.visit_reports ?? []).length;
    const healthScore = Math.max(50, 95 - (f.health_cases?.filter((c: any) => c.status !== "resolved").length ?? 0) * 10);
    return {
      id: f.id,
      farm: f.farm_name ?? "—",
      farmer_name: f.name ?? "—",
      species: f.livestock_type ?? "—",
      last_review: relativeTime(f.updated_at),
      report_count: reportCount,
      health_score: healthScore,
    };
  });
}

export async function fetchFarmerReviewDetail(farmerId: string) {
  const { data: farmer, error } = await supabase
    .from("farmers")
    .select("id, farm_name, name, livestock_type, contact_info, status, created_at, visit_reports(id, species, status), health_cases(id, diagnosis, status), nutrition_plans(id, plan_name, status)")
    .eq("id", farmerId)
    .single();
  if (error) throw error;
  return farmer;
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
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, priority, status, created_at, assigned_to")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((t: any) => ({
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
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, description, priority, status, created_at, updated_at, assigned_to, user_id, profiles(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
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
  let q = supabase
    .from("knowledge_articles")
    .select("id, title, category, tags, updated_at, is_published")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });
  
  if (category) q = q.eq("category", category);
  if (search) q = q.ilike("title", `%${search}%`);
  
  q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchArticleDetail(id: string) {
  const { data, error } = await supabase
    .from("knowledge_articles")
    .select("id, title, body, category, tags, is_published, created_at, updated_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
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
    supabase.from("health_cases").select("diagnosis, severity, status, created_at"),
    supabase.from("nutrition_plans").select("status, created_at"),
  ]);

  const cases = healthCases.data ?? [];
  const plans = nutritionPlans.data ?? [];

  // Most common diagnosis
  const diagnosisCounts: Record<string, number> = {};
  cases.forEach((c: any) => {
    if (c.diagnosis) diagnosisCounts[c.diagnosis] = (diagnosisCounts[c.diagnosis] ?? 0) + 1;
  });
  const most_common_diagnosis = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Most common nutrition issue (placeholder)
  const top_nutrition_issue = "Feed Deficiency";

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
    supabase.from("farmers").select("id, farm_name, health_cases(status)"),
    supabase.from("health_cases").select("severity, status"),
    supabase.from("visit_reports").select("created_at").gte("created_at", week.toISOString()),
  ]);

  const farmerCount = (farmers.data ?? []).length;
  const activeCases = (cases.data ?? []).filter((c: any) => c.status !== "resolved").length;
  const totalScore = (farmers.data ?? []).reduce((sum: number, f: any) => {
    const openCases = (f.health_cases ?? []).filter((c: any) => c.status !== "resolved").length;
    const score = Math.max(50, 95 - openCases * 10);
    return sum + score;
  }, 0);
  const avgHealthScore = farmerCount > 0 ? Math.round(totalScore / farmerCount) : 90;

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
    const day = new Date(r.created_at).toISOString().slice(0, 10);
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
