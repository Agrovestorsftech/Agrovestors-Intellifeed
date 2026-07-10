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

export const ROLE_LABEL: Record<UserRole, string> = {
  system_admin: "System Administrator",
  field_agent: "Field Agent",
  admin_agent: "Admin Agent · Nutrition & Vet",
  feedops: "Feed Operations",
};

/** Roles a visitor can self-assign at signup. system_admin is intentionally omitted. */
export const SIGNUP_ROLES: { value: Exclude<UserRole,"system_admin">; label: string; description: string }[] = [
  { value: "field_agent", label: "Field Agent", description: "Farm visits, farmer support, on-the-ground reports." },
  { value: "admin_agent", label: "Admin Agent (Nutrition / Vet)", description: "Nutritionists & veterinarians reviewing reports and plans." },
  { value: "feedops",     label: "Feed Operations",              description: "Inventory, production, warehouse and fulfilment." },
];