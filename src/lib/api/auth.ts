// Dashboard authentication (IntelliFeed360 backend, apps/accounts).
//
// Flow:
// 1. POST /auth/dashboard/login { email, password, client, device_id }
//    -> signed in, or { step_up_required: true } on a device not yet trusted,
//       in which case the backend emails a code.
// 2. POST /auth/dashboard/verify-device { email, code, client, device_id }
//    -> signed in; the device is trusted from then on.
// Signed in = a session cookie set by the backend; there is no token here.

import { api, resetCsrfToken } from "./client";

/** Backend platform roles (apps/iam/roles.py). */
export type BackendRole =
  | "farmer"
  | "researcher"
  | "agent"
  | "nutritionist"
  | "veterinarian"
  | "investor"
  | "feedops"
  | "admin"
  | "super_admin";

/** Login clients for the dashboards (AUTH_CLIENTS in config/settings/base.py). */
export type DashboardClient =
  | "agent_dashboard"
  | "nutritionist_dashboard"
  | "vet_dashboard"
  | "admin_dashboard"
  | "feedops_dashboard";

export interface BackendUser {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string | null;
  avatar_url?: string | null;
  status?: string;
  roles: BackendRole[];
  permissions?: string[];
}

interface SignedIn {
  user: BackendUser;
  client: DashboardClient;
}

export type DashboardLoginResult =
  | { kind: "signed_in"; user: BackendUser; client: DashboardClient }
  | { kind: "step_up"; channel: string };

export async function dashboardLogin(input: {
  email: string;
  password: string;
  client: DashboardClient;
  deviceId: string;
}): Promise<DashboardLoginResult> {
  const data = await api.post<Partial<SignedIn> & { step_up_required?: boolean; channel?: string }>(
    "/auth/dashboard/login",
    {
      email: input.email,
      password: input.password,
      client: input.client,
      device_id: input.deviceId,
    },
  );
  resetCsrfToken();
  if (data?.step_up_required) return { kind: "step_up", channel: data.channel ?? "email" };
  return { kind: "signed_in", user: data.user as BackendUser, client: data.client ?? input.client };
}

export async function verifyDashboardDevice(input: {
  email: string;
  code: string;
  client: DashboardClient;
  deviceId: string;
}): Promise<SignedIn> {
  const data = await api.post<SignedIn>("/auth/dashboard/verify-device", {
    email: input.email,
    code: input.code,
    client: input.client,
    device_id: input.deviceId,
  });
  resetCsrfToken();
  return data;
}

/** The signed-in user, or an ApiError (401/403) when there is no session. */
export function fetchMe(): Promise<BackendUser> {
  return api.get<BackendUser>("/auth/me");
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    resetCsrfToken();
  }
}

export function requestPasswordReset(email: string): Promise<unknown> {
  return api.post("/auth/password/forgot", { email });
}
