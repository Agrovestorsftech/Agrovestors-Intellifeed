import { supabase } from "@/integrations/supabase/client";

const API_ROOT = (import.meta.env.VITE_INTELLIFEED_API_URL ?? "").replace(/\/$/, "");

export class IntelliFeedApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "IntelliFeedApiError";
    this.status = status;
    this.details = details;
  }
}

type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };

async function accessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

function unwrap<T>(payload: T | Page<T>) {
  if (payload && typeof payload === "object" && "results" in payload && Array.isArray((payload as Page<T>).results)) {
    return (payload as Page<T>).results;
  }
  return payload;
}

export async function intellifeedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_ROOT) {
    throw new IntelliFeedApiError("IntelliFeed360 API URL is not configured.", 0);
  }

  const token = await accessToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_ROOT}${path}`, { ...init, headers });
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    if (response.status === 401) await supabase.auth.refreshSession();
    throw new IntelliFeedApiError(`IntelliFeed360 request failed (${response.status}).`, response.status, payload);
  }

  return payload as T;
}

export async function listResource<T>(path: string, params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries({ page_size: 100, ...params }).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  const payload = await intellifeedFetch<T | Page<T>>(`${path}?${query}`);
  return unwrap(payload) as T[];
}

export const intellifeed = {
  farms: () => listResource<any>("/api/v1/farms/"),
  assignments: (params?: Record<string, string | number | undefined>) => listResource<any>("/api/v1/farms/assignments/", params),
  visits: (params?: Record<string, string | number | undefined>) => listResource<any>("/api/v1/farms/visits/", params),
  healthCases: (params?: Record<string, string | number | undefined>) => listResource<any>("/api/v1/health/cases/", params),
  nutritionPlans: (params?: Record<string, string | number | undefined>) => listResource<any>("/api/v1/nutrition/plans/", params),
  supportTickets: (params?: Record<string, string | number | undefined>) => listResource<any>("/api/v1/support/tickets/", params),
};

export function apiErrorMessage(error: unknown) {
  if (error instanceof IntelliFeedApiError && error.status === 0) return "Connect the IntelliFeed360 API URL to load live dashboard data.";
  if (error instanceof IntelliFeedApiError && error.status === 401) return "Your IntelliFeed360 session expired. Sign in again to continue.";
  return error instanceof Error ? error.message : "Unable to load IntelliFeed360 data.";
}
