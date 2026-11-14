// Support tickets. DEMO MODE: backed by the in-memory mock store (src/lib/mock).
// Swap the bodies back to `api.*` calls once the backend exposes a support
// endpoint; the exported types/signatures are the contract.

import { mockDb as db } from "@/lib/mock/db";

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

export async function listSupportTickets(params: { status?: TicketStatus; page_size?: number } = {}): Promise<SupportTicketListItem[]> {
  let q = db.from("support_tickets").select("id, subject, priority, status, created_at, assigned_to");
  if (params.status) q = q.eq("status", params.status);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(params.page_size ?? 50);
  if (error) throw new Error(error.message);
  return (data ?? []) as SupportTicketListItem[];
}

export async function countOpenSupportTickets(): Promise<number> {
  const { count } = await db
    .from("support_tickets")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "in_progress"]);
  return count ?? 0;
}

export async function getSupportTicket(id: string): Promise<SupportTicketDetail> {
  const { data, error } = await db.from("support_tickets").select("*").eq("id", id).single();
  if (error || !data) throw new Error(error?.message ?? "Ticket not found");
  return { ...data, user: data.opened_by ?? "—", submitted_by: data.opened_by } as unknown as SupportTicketDetail;
}

export async function updateSupportTicketStatus(
  id: string,
  patch: { status?: TicketStatus; assigned_to?: string | null },
): Promise<SupportTicketDetail> {
  await db.from("support_tickets").update(patch).eq("id", id);
  return getSupportTicket(id);
}
