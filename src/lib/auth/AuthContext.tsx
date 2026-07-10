import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AuthUser, Session, UserRole } from "./types";
import { ROLE_LABEL } from "./types";

interface LoginResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

interface SignupInput {
  email: string;
  password: string;
  fullName: string;
  role: Exclude<UserRole, "system_admin">;
}

interface AuthContextValue {
  session: Session | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (input: SignupInput) => Promise<LoginResult>;
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

async function hydrateSessionFromSupabase(userId: string, email: string | undefined): Promise<Session | null> {
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("full_name, initials, avatar_url").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  const role = (roleRow?.role as UserRole | undefined) ?? "field_agent";
  const name = profile?.full_name || email?.split("@")[0] || "User";
  const initials = profile?.initials || computeInitials(name);
  const user: AuthUser = {
    id: userId,
    identifier: email ?? "",
    name,
    role,
    roleLabel: ROLE_LABEL[role],
    initials,
  };
  return { user, loggedInAt: Date.now() };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const sb = data.session;
    if (!sb?.user) {
      setSession(null);
      return;
    }
    setSession(await hydrateSessionFromSupabase(sb.user.id, sb.user.email ?? undefined));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();
      if (mounted) setHydrated(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event, sb) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      if (!sb?.user) {
        setSession(null);
        return;
      }
      // Fire-and-forget hydration; RLS ensures we only ever read our own profile+role.
      void hydrateSessionFromSupabase(sb.user.id, sb.user.email ?? undefined).then((s) => {
        setSession(s);
      });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const login = useCallback<AuthContextValue["login"]>(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "invalid" };
    }
    const s = await hydrateSessionFromSupabase(data.user.id, data.user.email ?? undefined);
    setSession(s);
    return { ok: !!s, user: s?.user };
  }, []);

  const signup = useCallback<AuthContextValue["signup"]>(async ({ email, password, fullName, role }) => {
    const emailRedirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo,
        data: { full_name: fullName.trim(), role },
      },
    });
    if (error) return { ok: false, error: error.message };
    if (!data.session && data.user) {
      // Email confirmation required — session not yet available.
      return { ok: false, error: "confirm-email" };
    }
    if (data.user) {
      const s = await hydrateSessionFromSupabase(data.user.id, data.user.email ?? undefined);
      setSession(s);
      return { ok: !!s, user: s?.user };
    }
    return { ok: false, error: "unknown" };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const value = useMemo(
    () => ({ session, hydrated, login, signup, logout, refresh }),
    [session, hydrated, login, signup, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}