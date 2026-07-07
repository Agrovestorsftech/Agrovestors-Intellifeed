import type { PortalId, UserRole } from "./types";

/** Public paths that don't require a session. */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/forgot-password"
  );
}

/** Which role owns the given URL. */
export function requiredRoleForPath(pathname: string): UserRole {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "system_admin";
  if (pathname === "/agent" || pathname.startsWith("/agent/")) return "admin_agent";
  if (pathname === "/feedops" || pathname.startsWith("/feedops/")) return "feedops";
  // All remaining top-level app routes belong to Field Agents.
  return "field_agent";
}

/** Which portal login page should a visitor to this path be sent to. */
export function portalForPath(pathname: string): PortalId {
  const role = requiredRoleForPath(pathname);
  switch (role) {
    case "system_admin":
      return "admin";
    case "feedops":
      return "feedops";
    case "field_agent":
    case "admin_agent":
    default:
      return "agent";
  }
}