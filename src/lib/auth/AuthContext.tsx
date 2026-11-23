import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, Session, UserRole } from "./types";
import { DASHBOARD_CLIENTS, ROLE_LABEL, canUseDashboard } from "./types";
import { getDeviceId } from "./device";
import { bindCurrentUser } from "@/lib/mock/db";
import { ApiError } from "@/lib/api/client";
import {
  dashboardLogin,
  fetchMe,
  logout as apiLogout,
  verifyDashboardDevice,
  type BackendUser,
  type DashboardClient,
} from "@/lib/api/auth";

// Two sign-in modes, chosen at build time by VITE_AUTH_MODE:
//
// - "demo" (default): mock auth, no backend. Any well-formed email + a
//   password of 6+ characters signs in. The role comes from the portal (or
//   the signup form). The session is kept in localStorage.
// - "api": the IntelliFeed360 backend's dashboard login (session cookie,
//   emailed code on a new device). Data screens still use the demo store
//   until each one is wired to the API.

export const AUTH_MODE: "demo" | "api" = import.meta.env.VITE_AUTH_MODE === "api" ? "api" : "demo";

const STORAGE_KEY = "if360.mockSession";
/** api mode: which dashboard this browser last signed in to (not a secret). */
const PORTAL_KEY = "if360.portalRole";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD_LENGTH = AUTH_MODE === "api" ? 1 : 6;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

interface LoginResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
  /** api mode: the backend emailed a code; call verifyDevice with it. */
  stepUp?: boolean;
  /** The code itself, for test accounts only (see dashboardLogin). */
  devCode?: string;
}

interface AuthContextValue {
  session: Session | null;
  hydrated: boolean;
  login: (
    email: string,
    password: string,
    role: UserRole,
    displayName?: string,
  ) => Promise<LoginResult>;
  /** api mode only: confirm the emailed code after a step-up login. */
  verifyDevice: (code: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

interface PendingStepUp {
  email: string;
  role: UserRole;
  client: DashboardClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** "jane.doe_99@x.com" → "Jane Doe" */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local
    .replace(/[0-9]+/g, " ")
    .split(/[._\-+\s]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase());
  return words.join(" ") || "Demo User";
}

/** Stable, UUID-shaped id derived from the email so "my" records persist across logins. */
function idFromEmail(email: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < email.length; i++) {
    const c = email.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ c, 2246822519) >>> 0;
  }
  const hex = (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).repeat(2);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function validateCredentials(email: string, password: string): string | null {
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

function readStored(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s?.user?.role && s.user.role in ROLE_LABEL ? s : null;
  } catch {
    return null;
  }
}

function writeStored(s: Session | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode etc.) — session just won't survive reload.
  }
}

function readPortal(): UserRole | null {
  try {
    const r = localStorage.getItem(PORTAL_KEY);
    return r && r in ROLE_LABEL ? (r as UserRole) : null;
  } catch {
    return null;
  }
}

function writePortal(role: UserRole | null) {
  try {
    if (role) localStorage.setItem(PORTAL_KEY, role);
    else localStorage.removeItem(PORTAL_KEY);
  } catch {
    // Without storage, a reload signs the user out of the dashboard view.
  }
}

function sessionFromBackend(u: BackendUser, role: UserRole): Session {
  const name =
    (u.full_name || `${u.first_name ?? ""} ${u.last_name ?? ""}`).trim() ||
    u.email ||
    "Staff member";
  const user: AuthUser = {
    id: u.id,
    identifier: u.email ?? "",
    name,
    role,
    roleLabel: ROLE_LABEL[role],
    initials: computeInitials(name),
  };
  return { user, loggedInAt: Date.now() };
}

/** User-facing message for a failed api-mode sign-in. */
function loginErrorMessage(err: unknown, role: UserRole): string {
  if (err instanceof ApiError) {
    if (err.code === "client_not_allowed")
      return `This account doesn't have access to the ${ROLE_LABEL[role]} dashboard.`;
    if (err.code === "invalid" && role === "feedops")
      return "FeedOps sign-in isn't available yet. The backend is adding FeedOps accounts.";
    if (err.message) return err.message;
  }
  return "Couldn't sign in. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const pending = useRef<PendingStepUp | null>(null);

  useEffect(() => {
    if (AUTH_MODE === "demo") {
      const stored = readStored();
      bindCurrentUser(stored?.user.id);
      setSession(stored);
      setHydrated(true);
      return;
    }
    // api mode: the cookie is the session; ask the backend who it belongs to.
    let cancelled = false;
    const role = readPortal();
    (async () => {
      let s: Session | null = null;
      if (role) {
        try {
          const me = await fetchMe();
          if (canUseDashboard(me.roles ?? [], role)) s = sessionFromBackend(me, role);
        } catch {
          // No session (401/403) or server unreachable: show the login page.
        }
      }
      if (cancelled) return;
      if (!s) writePortal(null);
      bindCurrentUser(s?.user.id);
      setSession(s);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completeApiLogin = useCallback((u: BackendUser, role: UserRole): LoginResult => {
    if (!canUseDashboard(u.roles ?? [], role)) {
      void apiLogout().catch(() => undefined);
      return {
        ok: false,
        error: `This account doesn't have access to the ${ROLE_LABEL[role]} dashboard.`,
      };
    }
    const s = sessionFromBackend(u, role);
    pending.current = null;
    writePortal(role);
    bindCurrentUser(s.user.id);
    setSession(s);
    return { ok: true, user: s.user };
  }, []);

  const apiLogin = useCallback(
    async (email: string, password: string, role: UserRole): Promise<LoginResult> => {
      const deviceId = getDeviceId();
      let lastError: unknown = null;
      for (const client of DASHBOARD_CLIENTS[role]) {
        try {
          const res = await dashboardLogin({ email: email.trim(), password, client, deviceId });
          if (res.kind === "step_up") {
            pending.current = { email: email.trim(), role, client };
            return { ok: false, stepUp: true, devCode: res.devCode };
          }
          return completeApiLogin(res.user, role);
        } catch (err) {
          lastError = err;
          // Wrong client for this account's role: try the next one (Admin Agents).
          if (err instanceof ApiError && err.code === "client_not_allowed") continue;
          break;
        }
      }
      return { ok: false, error: loginErrorMessage(lastError, role) };
    },
    [completeApiLogin],
  );

  const verifyDevice = useCallback<AuthContextValue["verifyDevice"]>(
    async (code) => {
      const p = pending.current;
      if (!p)
        return { ok: false, error: "Your sign-in expired. Enter your email and password again." };
      try {
        const res = await verifyDashboardDevice({
          email: p.email,
          code: code.trim(),
          client: p.client,
          deviceId: getDeviceId(),
        });
        return completeApiLogin(res.user, p.role);
      } catch (err) {
        return { ok: false, error: loginErrorMessage(err, p.role) };
      }
    },
    [completeApiLogin],
  );

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password, role, displayName) => {
      if (AUTH_MODE === "api") return apiLogin(email, password, role);
      const error = validateCredentials(email, password);
      if (error) return { ok: false, error };
      const identifier = email.trim().toLowerCase();
      const name = displayName?.trim() || nameFromEmail(identifier);
      const user: AuthUser = {
        id: idFromEmail(identifier),
        identifier,
        name,
        role,
        roleLabel: ROLE_LABEL[role],
        initials: computeInitials(name),
      };
      const s: Session = { user, loggedInAt: Date.now() };
      bindCurrentUser(user.id);
      writeStored(s);
      setSession(s);
      return { ok: true, user };
    },
    [apiLogin],
  );

  const logout = useCallback(async () => {
    if (AUTH_MODE === "api") {
      // Clear the local view even if the server call fails (e.g. offline).
      await apiLogout().catch(() => undefined);
      writePortal(null);
    }
    writeStored(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, hydrated, login, verifyDevice, logout }),
    [session, hydrated, login, verifyDevice, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
