import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { findAccount } from "./mock-users";
import { clearSession, readSession, writeSession, SESSION_STORAGE_KEY } from "./session";
import type { AuthUser, PortalId, Session } from "./types";

interface LoginResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

interface AuthContextValue {
  session: Session | null;
  hydrated: boolean;
  login: (identifier: string, password: string, portal: PortalId) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (client only).
  useEffect(() => {
    setSession(readSession());
    setHydrated(true);
  }, []);

  // Sync across tabs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SESSION_STORAGE_KEY) return;
      setSession(readSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async (identifier, password, portal) => {
      // Simulate a realistic 1–2s network delay.
      await new Promise((r) => setTimeout(r, 1200));
      const user = findAccount(identifier, password, portal);
      if (!user) {
        return { ok: false, error: "invalid" };
      }
      const next: Session = { user, loggedInAt: Date.now() };
      writeSession(next);
      setSession(next);
      return { ok: true, user };
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, hydrated, login, logout }),
    [session, hydrated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}