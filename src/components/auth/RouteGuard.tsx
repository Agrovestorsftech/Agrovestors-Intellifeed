import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  isPublicPath,
  portalForPath,
  requiredRoleForPath,
} from "@/lib/auth/route-policy";
import { PORTAL_LOGIN, ROLE_HOME } from "@/lib/auth/types";

/**
 * Frontend-only route guard. Renders children when the current session is
 * allowed on the current path; otherwise redirects to login or to the
 * user's own dashboard. Public paths render unconditionally.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, hydrated } = useAuth();
  const navigate = useNavigate();

  const publicPath = isPublicPath(pathname);
  const requiredRole = requiredRoleForPath(pathname);
  const allowed = publicPath || (!!session && session.user.role === requiredRole);

  useEffect(() => {
    if (!hydrated) return;

    // Signed-in users visiting a login page → send home.
    if (publicPath && session) {
      navigate({ to: ROLE_HOME[session.user.role], replace: true });
      return;
    }

    if (publicPath) return;

    if (!session) {
      navigate({ to: PORTAL_LOGIN[portalForPath(pathname)], replace: true });
      return;
    }

    if (session.user.role !== requiredRole) {
      navigate({ to: ROLE_HOME[session.user.role], replace: true });
    }
  }, [hydrated, publicPath, session, pathname, requiredRole, navigate]);

  if (publicPath) {
    // Avoid flashing the login form while redirecting an already-signed-in user.
    if (hydrated && session) return <FullScreenLoader />;
    return <>{children}</>;
  }

  if (!hydrated || !allowed) return <FullScreenLoader />;

  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}