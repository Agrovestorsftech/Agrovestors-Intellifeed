import { Link, useNavigate } from "@tanstack/react-router";
import { Sprout, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth, MIN_PASSWORD_LENGTH } from "@/lib/auth/AuthContext";
import { ROLE_HOME, ROLE_LABEL, type PortalId, type UserRole } from "@/lib/auth/types";

interface LoginCardProps {
  portal: PortalId;
  portalName: string; // "Admin Portal"
  tagline: string;
  hint?: ReactNode;
  accent: "primary" | "info" | "warning";
}

const accentButton: Record<LoginCardProps["accent"], string> = {
  primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30",
  info: "bg-info hover:bg-info/90 text-info-foreground shadow-lg shadow-info/30",
  warning: "bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg shadow-warning/30",
};

const accentIcon: Record<LoginCardProps["accent"], string> = {
  primary: "bg-primary/15 ring-primary/30 text-primary",
  info: "bg-info/15 ring-info/30 text-info",
  warning: "bg-warning/15 ring-warning/30 text-warning",
};

/** Roles each portal can sign in as. The agent portal is shared. */
const PORTAL_ROLES: Record<PortalId, UserRole[]> = {
  admin: ["system_admin"],
  agent: ["field_agent", "admin_agent"],
  feedops: ["feedops"],
};

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60";

// DEMO MODE: email + password, validated locally only (see AuthContext).
export function LoginCard({ portal, portalName, tagline, hint, accent }: LoginCardProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const roles = PORTAL_ROLES[portal];
  const [role, setRole] = useState<UserRole>(roles[0]!);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const result = await login(email, password, role);
    if (!result.ok || !result.user) {
      setSubmitting(false);
      setError(result.error ?? "Couldn't sign in. Please try again.");
      return;
    }
    navigate({ to: ROLE_HOME[result.user.role], replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${accentIcon[accent]}`}>
            <Sprout className="h-5 w-5" />
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold tracking-tight">IntelliFeed</span>
            <span className="text-2xl font-semibold text-primary tracking-tight">360</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">{portalName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {roles.length > 1 && (
              <fieldset>
                <legend className="text-sm font-medium text-foreground">Sign in as</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={role === r}
                      onClick={() => setRole(r)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        role === r
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-input text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r === "admin_agent" ? "Admin Agent (Nutrition/Vet)" : ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-70 ${accentButton[accent]}`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            <div className="flex items-center justify-between text-xs">
              <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground transition-colors">
                Forgot password?
              </Link>
              <Link to="/signup" className="text-primary hover:underline">
                Create account
              </Link>
            </div>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Demo mode:</span> any valid email and a password
            of {MIN_PASSWORD_LENGTH}+ characters will sign you in. All data is sample data.
            {hint && <div className="mt-2">{hint}</div>}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">IntelliFeed360 · {portalName}</p>
      </div>
    </div>
  );
}
