import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, Session, UserRole } from "./types";
import { ROLE_LABEL } from "./types";
import { bindCurrentUser } from "@/lib/mock/db";

// --- DEMO MODE: mock auth, no backend. ---
// Any well-formed email + a password of 6+ characters signs in. The role is
// chosen by the portal (or the signup form), not looked up anywhere. The
// session is kept in localStorage so a reload stays signed in.

const STORAGE_KEY = "if360.mockSession";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD_LENGTH = 6;

interface LoginResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

interface AuthContextValue {
  session: Session | null;
  hydrated: boolean;
  login: (email: string, password: string, role: UserRole, displayName?: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    bindCurrentUser(stored?.user.id);
    setSession(stored);
    setHydrated(true);
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (email, password, role, displayName) => {
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
  }, []);

  const logout = useCallback(async () => {
    writeStored(null);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, hydrated, login, logout }), [session, hydrated, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
