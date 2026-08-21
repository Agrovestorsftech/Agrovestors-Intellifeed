import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { sendOtp, verifyOtp, fetchMe, logout as apiLogout, type IntellifeedUser } from "@/lib/api/auth";
import { tokenStore } from "@/lib/api/client";
import type { AuthUser, Session } from "./types";
import { ROLE_LABEL, mapApiRoleToUserRole } from "./types";

// --- Login is now a two-step OTP flow (phone OR email -> code), not password. ---
// See MIGRATION_PLAN.md Phase 2 for the field-name caveats on otp/send and
// otp/verify — the API spec didn't document their request/response bodies.

interface RequestOtpResult {
  ok: boolean;
  error?: string;
}

interface VerifyOtpResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

interface AuthContextValue {
  session: Session | null;
  hydrated: boolean;
  requestOtp: (identifier: string) => Promise<RequestOtpResult>;
  verifyLogin: (identifier: string, otp: string) => Promise<VerifyOtpResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

function toSession(apiUser: IntellifeedUser): Session {
  const role = mapApiRoleToUserRole(apiUser.role);
  const name = `${apiUser.first_name} ${apiUser.last_name}`.trim() || apiUser.phone;
  const user: AuthUser = {
    id: apiUser.id,
    identifier: apiUser.phone,
    name,
    role,
    roleLabel: ROLE_LABEL[role],
    initials: computeInitials(name),
  };
  return { user, loggedInAt: Date.now() };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setSession(null);
      return;
    }
    try {
      const me = await fetchMe();
      setSession(toSession(me));
    } catch {
      // Access token invalid/expired and refresh failed (handled inside apiFetch).
      tokenStore.clear();
      setSession(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();
      if (mounted) setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const requestOtp = useCallback<AuthContextValue["requestOtp"]>(async (identifier) => {
    try {
      await sendOtp(identifier.trim());
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Failed to send code." };
    }
  }, []);

  const verifyLogin = useCallback<AuthContextValue["verifyLogin"]>(async (identifier, otp) => {
    try {
      const result = await verifyOtp(identifier.trim(), otp.trim());
      tokenStore.set(result.access, result.refresh);
      const s = toSession(result.user);
      setSession(s);
      return { ok: true, user: s.user };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "invalid" };
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    tokenStore.clear();
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const value = useMemo(
    () => ({ session, hydrated, requestOtp, verifyLogin, logout, refresh }),
    [session, hydrated, requestOtp, verifyLogin, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}