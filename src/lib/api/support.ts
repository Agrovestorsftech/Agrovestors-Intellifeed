// Support tickets, switched by AUTH_MODE.
//
// - demo: the in-memory mock store (src/lib/mock).
// - api: /support/tickets/ (apps.support). The backend scopes the list: the
//   support desk (admins, nutritionists, vets) sees every ticket; everyone
//   else sees the tickets they raised or were assigned.

import { AUTH_MODE } from "@/lib/auth/AuthContext";
import { api, type Page } from "@/lib/api/client";
import { mockDb as db } from "@/lib/mock/db";

const IS_API = AUTH_MODE === "api";

export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportTicketListItem {
  id: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  assigned_to: string | null;
}

export interface SupportTicketDetail extends SupportTicketListItem {
  description: string;
  updated_at: string;
  user: string;
  submitted_by: string | null;
}

export interface CreateTicketInput {
  subject: string;
  description?: string;
  priority?: TicketPriority;
}

// --- Backend shape (apps/support/views.py) ----------------------------------

interface ApiPerson {
  id: string;
  full_name: string;
}

interface ApiTicket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  submitted_by: ApiPerson | null;
  assigned_to: ApiPerson | null;
  created_at: string;
  updated_at: string;
}

const toListItem = (t: ApiTicket): SupportTicketListItem => ({
  id: t.id,
  subject: t.subject,
  priority: t.priority,
  status: t.status,
  created_at: t.created_at,
  assigned_to: t.assigned_to?.full_name ?? null,
});

const toDetail = (t: ApiTicket): SupportTicketDetail => ({
  ...toListItem(t),
  description: t.description,
  updated_at: t.updated_at,
  user: t.submitted_by?.full_name ?? "—",
  submitted_by: t.submitted_by?.id ?? null,
});

async function apiList(
  status: TicketStatus | undefined,
  pageSize: number,
): Promise<Page<ApiTicket>> {
  const qs = new URLSearchParams({ page_size: String(pageSize) });
  if (status) qs.set("status", status);
  return api.get<Page<ApiTicket>>(`/support/tickets/?${qs}`);
}

// --- Reads ------------------------------------------------------------------

export async function listSupportTickets(
  params: { status?: TicketStatus; page_size?: number } = {},
): Promise<SupportTicketListItem[]> {
  if (IS_API) return (await apiList(params.status, params.page_size ?? 50)).results.map(toListItem);
  let q = db
    .from("support_tickets")
    .select("id, subject, priority, status, created_at, assigned_to");
  if (params.status) q = q.eq("status", params.status);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(params.page_size ?? 50);
  if (error) throw new Error(error.message);
  return (data ?? []) as SupportTicketListItem[];
}

/** Tickets still being worked (open or in progress), newest first. */
export async function listActiveSupportTickets(limit: number): Promise<SupportTicketListItem[]> {
  if (!IS_API) {
    const all = await listSupportTickets({ page_size: limit * 4 });
    return all.filter((t) => t.status === "open" || t.status === "in_progress").slice(0, limit);
  }
  const [open, working] = await Promise.all([
    apiList("open", limit),
    apiList("in_progress", limit),
  ]);
  return [...open.results, ...working.results]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(toListItem);
}

/** Tickets the signed-in user raised. In api mode a non-desk user's list is
 * already their own (plus any assigned to them). */
export async function listMySupportTickets(userId: string): Promise<SupportTicketListItem[]> {
  if (IS_API) {
    const page = await apiList(undefined, 100);
    return page.results
      .filter((t) => !t.submitted_by || t.submitted_by.id === userId)
      .map(toListItem);
  }
  const { data, error } = await db
    .from("support_tickets")
    .select("id, subject, status, priority, created_at, assigned_to")
    .eq("opened_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SupportTicketListItem[];
}

export async function countOpenSupportTickets(): Promise<number> {
  if (IS_API) {
    const [open, working] = await Promise.all([apiList("open", 1), apiList("in_progress", 1)]);
    return open.count + working.count;
  }
  const { count } = await db
    .from("support_tickets")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "in_progress"]);
  return count ?? 0;
}

export async function getSupportTicket(id: string): Promise<SupportTicketDetail> {
  if (IS_API) return toDetail(await api.get<ApiTicket>(`/support/tickets/${id}/`));
  const { data, error } = await db.from("support_tickets").select("*").eq("id", id).single();
  if (error || !data) throw new Error(error?.message ?? "Ticket not found");
  return {
    ...data,
    user: data.opened_by ?? "—",
    submitted_by: data.opened_by,
  } as unknown as SupportTicketDetail;
}

// --- Writes -----------------------------------------------------------------

export async function createSupportTicket(
  input: CreateTicketInput,
  openedBy?: string,
): Promise<void> {
  const subject = input.subject.trim();
  const description = input.description?.trim() ?? "";
  const priority = input.priority ?? "normal";
  if (IS_API) {
    await api.post("/support/tickets/", { subject, description, priority });
    return;
  }
  const { error } = await db.from("support_tickets").insert({
    opened_by: openedBy,
    subject,
    description,
    priority,
    status: "open",
    portal: "agent",
  });
  if (error) throw new Error(error.message);
}

export async function updateSupportTicketStatus(
  id: string,
  patch: { status?: TicketStatus; assigned_to?: string | null },
): Promise<SupportTicketDetail> {
  if (IS_API) {
    // The backend assigns by user id; this helper only ever moves status.
    const body: Record<string, unknown> = {};
    if (patch.status) body.status = patch.status;
    return toDetail(await api.patch<ApiTicket>(`/support/tickets/${id}/`, body));
  }
  await db.from("support_tickets").update(patch).eq("id", id);
  return getSupportTicket(id);
}
