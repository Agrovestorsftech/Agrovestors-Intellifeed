// Support tickets — replaces the old Supabase `support_tickets` table.
// Backend: /api/v1/support/tickets/ (list/detail/create/update).
// See backend-additions/apps/support/ for the server-side implementation
// this client assumes.

import { api, unwrapPage } from "./client";

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
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  query.set("page_size", String(params.page_size ?? 50));
  const page = await api.get<any>(`/support/tickets/?${query}`);
  return unwrapPage(page);
}

// Uses the pagination envelope's `count` rather than fetching+unwrapping
// full pages, for KPI tiles that only need a number.
export async function countOpenSupportTickets(): Promise<number> {
  const page = await api.get<{ count: number }>(`/support/tickets/?status=open&page_size=1`);
  const inProgress = await api.get<{ count: number }>(`/support/tickets/?status=in_progress&page_size=1`);
  return (page.count ?? 0) + (inProgress.count ?? 0);
}

export async function getSupportTicket(id: string): Promise<SupportTicketDetail> {
  return api.get<SupportTicketDetail>(`/support/tickets/${id}/`);
}

export async function createSupportTicket(input: CreateTicketInput): Promise<SupportTicketDetail> {
  return api.post<SupportTicketDetail>("/support/tickets/", input);
}

// Staff-only (agent/admin) — enforced server-side, not just here.
export async function updateSupportTicketStatus(id: string, patch: { status?: TicketStatus; assigned_to?: string | null }): Promise<SupportTicketDetail> {
  return api.patch<SupportTicketDetail>(`/support/tickets/${id}/`, patch);
}