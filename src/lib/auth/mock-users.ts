import type { AuthUser, PortalId, UserRole } from "./types";

interface MockAccount {
  identifier: string; // email / agent id / staff id (case-insensitive match)
  password: string;
  portals: PortalId[]; // which login page(s) this account may sign in from
  user: Omit<AuthUser, "identifier">;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    identifier: "admin@intellifeed360.com",
    password: "Password123",
    portals: ["admin"],
    user: {
      id: "usr_admin_001",
      name: "Adaeze Okafor",
      role: "system_admin",
      roleLabel: "System Administrator",
      initials: "AO",
    },
  },
  {
    identifier: "AGT001",
    password: "Password123",
    portals: ["agent"],
    user: {
      id: "usr_agt_001",
      name: "John Field",
      role: "field_agent",
      roleLabel: "Field Agent",
      initials: "JF",
    },
  },
  {
    identifier: "ADM001",
    password: "Password123",
    portals: ["agent"],
    user: {
      id: "usr_adm_001",
      name: "Dr. Jane Smith",
      role: "admin_agent",
      roleLabel: "Admin Agent · Nutrition & Vet",
      initials: "JS",
    },
  },
  {
    identifier: "FOP001",
    password: "Password123",
    portals: ["feedops"],
    user: {
      id: "usr_fop_001",
      name: "Musa Ibrahim",
      role: "feedops",
      roleLabel: "Feed Operations",
      initials: "MI",
    },
  },
];

export function findAccount(
  identifier: string,
  password: string,
  portal: PortalId,
): AuthUser | null {
  const normalized = identifier.trim().toLowerCase();
  const match = MOCK_ACCOUNTS.find(
    (a) =>
      a.identifier.toLowerCase() === normalized &&
      a.password === password &&
      a.portals.includes(portal),
  );
  if (!match) return null;
  return { ...match.user, identifier: match.identifier };
}

export type { UserRole };