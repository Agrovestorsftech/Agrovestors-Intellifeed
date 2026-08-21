export type UserRole =
  | "system_admin"
  | "field_agent"
  | "admin_agent"
  | "feedops";

// IntelliFeed360 API's role enum (Role430Enum). Kept distinct from UserRole
// because the two models don't line up 1:1 — see the mapping + gaps below.
export type ApiRole = "farmer" | "agent" | "nutritionist" | "admin" | "investor";

/**
 * Best-guess mapping from the API's role model to this app's existing
 * portal/role model. NOT confirmed against product requirements:
 *  - "admin"        -> system_admin   (straightforward)
 *  - "agent"        -> field_agent    (straightforward)
 *  - "nutritionist" -> admin_agent    (closest match to "Nutrition & Vet")
 *  - "farmer"       -> no portal exists in this app yet. Falls back to
 *                      field_agent so the app doesn't crash, but a farmer
 *                      logging in will land on the wrong dashboard. Needs a
 *                      product decision + likely a new portal.
 *  - "investor"     -> no portal exists in this app yet. Same fallback and
 *                      same caveat as "farmer".
 *  - "feedops" (this app's role) has NO equivalent in the API's role enum
 *    at all. Nothing currently maps to it — the Feed Operations portal will
 *    be unreachable for any real API user until this is resolved.
 * Flagged in MIGRATION_PLAN.md Phase 2 gaps. Fix in this one spot once the
 * product decision is made.
 */
export function mapApiRoleToUserRole(role: ApiRole): UserRole {
  switch (role) {
    case "admin":
      return "system_admin";
    case "agent":
      return "field_agent";
    case "nutritionist":
      return "admin_agent";
    case "farmer":
    case "investor":
    default:
      return "field_agent";
  }
}

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