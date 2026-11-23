import type { BackendRole, DashboardClient } from "@/lib/api/auth";

export type UserRole = "system_admin" | "field_agent" | "admin_agent" | "feedops";

/**
 * Backend platform roles (apps/iam/roles.py) that open each dashboard.
 * farmer, researcher and investor have no dashboard. `feedops` does not exist
 * in the backend yet (backend requirements R1).
 */
export const BACKEND_ROLES_FOR: Record<UserRole, readonly BackendRole[]> = {
  system_admin: ["admin", "super_admin"],
  field_agent: ["agent"],
  admin_agent: ["nutritionist", "veterinarian"],
  feedops: ["feedops"],
};

/**
 * Login clients to try for each dashboard, in order. Admin Agents try the
 * nutritionist client, then the vet one, because the backend still has one
 * client per role. Once backend requirement R2 merges them into
 * `agent_dashboard`, this becomes a single entry per dashboard.
 */
export const DASHBOARD_CLIENTS: Record<UserRole, readonly DashboardClient[]> = {
  system_admin: ["admin_dashboard"],
  field_agent: ["agent_dashboard"],
  admin_agent: ["nutritionist_dashboard", "vet_dashboard"],
  feedops: ["feedops_dashboard"],
};

/** True when the backend roles allow this dashboard. */
export function canUseDashboard(roles: readonly string[], role: UserRole): boolean {
  return BACKEND_ROLES_FOR[role].some((r) => roles.includes(r));
}

export type PortalId = "admin" | "agent" | "feedops" | "field";

export interface AuthUser {
  id: string;
  identifier: string; // email / agent id / staff id used to log in
  name: string;
  role: UserRole;
  roleLabel: string;
  initials: string;
}

export interface Session {
  user: AuthUser;
  loggedInAt: number;
}

/** Where each role lives. */
export const ROLE_HOME: Record<UserRole, string> = {
  system_admin: "/admin",
  field_agent: "/",
  admin_agent: "/agent",
  feedops: "/feedops",
};

/** Which portal login page a given portal uses. */
export const PORTAL_LOGIN: Record<PortalId, string> = {
  field: "/login",
  admin: "/login/admin",
  agent: "/login/agent",
  feedops: "/login/feedops",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  system_admin: "System Administrator",
  field_agent: "Field Agent",
  admin_agent: "Admin Agent · Nutrition & Vet",
  feedops: "Feed Operations",
};

/** Login page for each role — the URL decides the role, there is no picker. */
export const ROLE_LOGIN: Record<UserRole, string> = {
  field_agent: "/login",
  admin_agent: "/login/agent",
  feedops: "/login/feedops",
  system_admin: "/login/admin",
};

/** Signup page for each self-registrable role. system_admin is intentionally omitted. */
export const ROLE_SIGNUP: Partial<Record<UserRole, string>> = {
  field_agent: "/signup",
  admin_agent: "/signup/agent",
  feedops: "/signup/feedops",
};
