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
    count("farmers"),
    count("user_roles"),
    count("nutrition_plans"),
    count("health_cases", (q) => q.in("status", ["open", "in_progress"])),
    count("visit_reports", (q) => q.eq("follow_up_needed", true)),
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
    count("farmers"),
    count("nutrition_plans"),
    count("health_cases", (q) => q.in("status", ["open", "in_progress"])),
    count("tasks", (q) => q.in("status", ["pending", "in_progress", "open", "urgent"])),
    count("visit_reports", (q) => q.eq("follow_up_needed", true)),
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
    .select("id, visit_type, visit_date, created_at, follow_up_needed, farmers(farm_name)")
    .eq("follow_up_needed", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    farmer: "Farmer",
    farm: r.farmers?.farm_name ?? "—",
    species: r.visit_type,
    submitted: relativeTime(r.created_at),
    priority: r.follow_up_needed ? "High" : "Normal",
    status: "Pending",
  }));
}

export async function fetchFarmerHealth(limit = 8) {
  const { data, error } = await supabase
    .from("farmers")
    .select("id, farm_name, primary_livestock_type, updated_at, health_cases(case_type, status)")
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
      species: f.primary_livestock_type ?? "—",
      score,
      risk: openCases.length === 0 ? "Low" : worst === "critical" || worst === "high" ? "High" : "Medium",
      lastReview: relativeTime(f.updated_at),
    };
  });
}

export async function fetchCriticalAlerts(limit = 6) {
  const { data, error } = await supabase
    .from("health_cases")
    .select("id, case_type, status, diagnosis, created_at, farmers(farm_name)")
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id,
    title: c.diagnosis ?? "Health alert",
    farm: c.farmers?.farm_name ?? "—",
    priority: c.case_type === "respiratory_disease" ? "Critical" : "High",
  }));
}

export async function fetchKnowledgeArticles(limit = 6) {
  const { data, error } = await supabase
    .from("knowledge_articles")
    .select("id, title, category, is_published")
    .eq("is_published", true)
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
    count("farmers", (q) => q.eq("user_id", userId)),
    count("visit_reports", (q) => q.eq("visitor_id", userId).gte("visit_date", new Date().toISOString().slice(0, 10))),
    count("visit_reports", (q) => q.eq("visitor_id", userId).eq("follow_up_needed", true)),
    count("visit_reports", (q) => q.eq("visitor_id", userId).gte("visit_date", startWeek.toISOString().slice(0, 10))),
    count("health_cases", (q) => q.in("severity", ["critical", "high"]).neq("status", "resolved")),
  ]);
  return { assigned, todayVisits: todayReports, pendingReports: pending, completedThisWeek: weekReports, urgentAlerts: alerts };
}

export async function fetchTodaysSchedule(userId: string | undefined, limit = 6) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("visit_reports")
    .select("id, visit_type, visit_date, created_at, follow_up_needed, farmers(farm_name)")
    .eq("visitor_id", userId)
    .eq("visit_date", new Date().toISOString().slice(0, 10))
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    farm: r.farmers?.farm_name ?? "—",
    category: r.visit_type ?? "Visit",
    time: new Date(r.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    status: r.follow_up_needed ? "Pending" : "Completed",
  }));
}

/* --------------------------------- Shared --------------------------------- */

export async function fetchActivities(limit = 20) {
  const { data, error } = await supabase
    .from("activities")
    .select("id, activity_type, description, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchUnreadNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, notification_type, is_read, created_at")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllNotifications(limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, notification_type, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function fetchSupportTickets(limit = 6) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, title, priority, status, created_at")
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
