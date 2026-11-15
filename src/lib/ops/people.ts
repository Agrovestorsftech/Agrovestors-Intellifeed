// Shared helpers for admin pages that deal with people and roles.
import { ROLE_LABEL, type UserRole } from "@/lib/auth/types";

export const ROLE_OPTIONS = (Object.keys(ROLE_LABEL) as UserRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }));
export const REGIONS = ["Kaduna", "Oyo", "Ogun", "Plateau", "Kano", "Benue", "Enugu", "HQ"];
export const REGION_OPTIONS = REGIONS.map((r) => ({ value: r, label: r }));

export function roleLabel(role: string, customRoles: { key: string; name: string }[] = []): string {
  return ROLE_LABEL[role as UserRole] ?? customRoles.find((r) => r.key === role)?.name ?? role;
}

export function initials(name: string) {
  const p = name.replace(/^Dr\.\s*/, "").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? (p[p.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

/** Small avatar + name + secondary line, used in admin tables. */
export const PERMISSION_LABELS: Record<string, string> = {
  "farmers.view": "View farmers",
  "farmers.edit": "Add & edit farmers",
  "visits.create": "Log farm visits",
  "reports.submit": "Submit visit reports",
  "reports.review": "Review visit reports",
  "plans.publish": "Publish nutrition plans",
  "cases.manage": "Manage health cases",
  "orders.create": "Place feed orders",
  "orders.manage": "Fulfil feed orders",
  "inventory.manage": "Manage inventory",
  "production.manage": "Manage production",
  "users.manage": "Manage users",
  "roles.manage": "Manage roles & permissions",
  "billing.view": "View billing",
  "settings.manage": "Change platform settings",
};
export const PERMISSIONS = Object.keys(PERMISSION_LABELS);
