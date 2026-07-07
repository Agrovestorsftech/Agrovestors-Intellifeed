export type UserRole =
  | "system_admin"
  | "field_agent"
  | "admin_agent"
  | "feedops";

export type PortalId = "admin" | "agent" | "feedops";

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
  admin: "/login/admin",
  agent: "/login/agent",
  feedops: "/login/feedops",
};